/**
 * ICT (Inner Circle Trader) confluence engine.
 *
 * Pure TypeScript with no DOM or Node dependencies, so the browser preview
 * (Smart ICT node / studio) and the server-side workflow executor run exactly
 * the same logic against real OHLC candles.
 *
 * Each concept is detected from price action for BOTH sides (BUY / SELL). The
 * score of a side is the weight of the concepts that fired divided by the
 * weight of all enabled concepts. The stronger side wins; the trade is only
 * authorised when it clears the threshold and no hard filter blocks it.
 */
import type {
  Candle,
  ConceptSignal,
  ConfluenceEvaluationResult,
  ICTStudioState,
} from './types'

export type Side = 'BUY' | 'SELL'

export interface AnalyzeOptions {
  /** Size of one pip in price units. Inferred from the price when omitted. */
  pipSize?: number
  /** Swing strength: candles on each side needed to confirm a fractal swing. */
  swingStrength?: number
  /** How many recent candles a sweep / FVG may be old and still count. */
  recentWindow?: number
}

interface Swing {
  index: number
  price: number
  type: 'high' | 'low'
}

interface Zone {
  index: number
  low: number
  high: number
  side: Side
  sizePips: number
  mitigated: boolean
}

interface SideAnalysis {
  side: Side
  signals: ConceptSignal[]
  score: number
  /** Price levels that can anchor a stop (sweep wick, OB edge, swing). */
  stopAnchors: number[]
  blockedBy?: string
}

const MIN_CANDLES = 30

// ---------------------------------------------------------------------------
// Candle helpers
// ---------------------------------------------------------------------------

/** Accepts the many shapes market-data APIs return and produces clean, sorted candles. */
export function normalizeCandles(input: unknown): Candle[] {
  if (!Array.isArray(input)) return []
  const out: Candle[] = []
  for (const row of input) {
    let t: unknown, o: unknown, h: unknown, l: unknown, c: unknown, v: unknown
    if (Array.isArray(row)) {
      ;[t, o, h, l, c, v] = row
    } else if (row && typeof row === 'object') {
      const r = row as Record<string, unknown>
      t = r.time ?? r.t ?? r.timestamp ?? r.date ?? r.openTime
      o = r.open ?? r.o
      h = r.high ?? r.h
      l = r.low ?? r.l
      c = r.close ?? r.c
      v = r.volume ?? r.v
    } else continue

    let time = typeof t === 'string' && Number.isNaN(Number(t)) ? Date.parse(t) : Number(t)
    if (!Number.isFinite(time)) continue
    if (time < 1e11) time *= 1000 // seconds -> ms

    const open = Number(o)
    const high = Number(h)
    const low = Number(l)
    const close = Number(c)
    if (![open, high, low, close].every(Number.isFinite)) continue
    if (high < low) continue

    const candle: Candle = { time, open, high, low, close }
    const vol = Number(v)
    if (v !== undefined && v !== null && Number.isFinite(vol)) candle.volume = vol
    out.push(candle)
  }
  out.sort((a, b) => a.time - b.time)
  return out
}

/** Deterministic synthetic candles so previews work without a market-data feed. */
export function generateSampleCandles(count = 220, seed = 7, endTime = Date.now()): Candle[] {
  let s = seed >>> 0 || 1
  const rand = () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    return s / 0x100000000
  }
  const step = 15 * 60 * 1000
  const start = Math.floor(endTime / step) * step - (count - 1) * step
  const out: Candle[] = []
  let price = 1.0924
  let drift = 0
  for (let i = 0; i < count; i++) {
    if (i % 25 === 0) drift = (rand() - 0.5) * 0.00018
    const open = price
    const move = drift + (rand() - 0.5) * 0.0007
    const close = open + move
    const high = Math.max(open, close) + rand() * 0.00035
    const low = Math.min(open, close) - rand() * 0.00035
    out.push({ time: start + i * step, open, high, low, close, volume: 800 + rand() * 1200 })
    price = close
  }
  return out
}

function inferPip(price: number): number {
  if (price >= 500) return 0.1
  if (price >= 20) return 0.01
  return 0.0001
}

function avg(values: number[]): number {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0
}

function computeATR(c: Candle[], period = 14): number {
  const trs: number[] = []
  for (let i = Math.max(1, c.length - period); i < c.length; i++) {
    trs.push(Math.max(c[i].high - c[i].low, Math.abs(c[i].high - c[i - 1].close), Math.abs(c[i].low - c[i - 1].close)))
  }
  return avg(trs)
}

function body(k: Candle): number {
  return Math.abs(k.close - k.open)
}

function findSwings(c: Candle[], strength: number): Swing[] {
  const swings: Swing[] = []
  for (let i = strength; i < c.length - strength; i++) {
    let isHigh = true
    let isLow = true
    for (let k = 1; k <= strength; k++) {
      if (c[i].high <= c[i - k].high || c[i].high <= c[i + k].high) isHigh = false
      if (c[i].low >= c[i - k].low || c[i].low >= c[i + k].low) isLow = false
    }
    if (isHigh) swings.push({ index: i, price: c[i].high, type: 'high' })
    if (isLow) swings.push({ index: i, price: c[i].low, type: 'low' })
  }
  return swings
}

// ---------------------------------------------------------------------------
// Concept detectors
// ---------------------------------------------------------------------------

function findFVGs(c: Candle[], pip: number): Zone[] {
  const zones: Zone[] = []
  for (let i = 2; i < c.length; i++) {
    const a = c[i - 2]
    const b = c[i]
    let zone: Zone | null = null
    if (b.low > a.high) {
      zone = { index: i, low: a.high, high: b.low, side: 'BUY', sizePips: (b.low - a.high) / pip, mitigated: false }
    } else if (b.high < a.low) {
      zone = { index: i, low: b.high, high: a.low, side: 'SELL', sizePips: (a.low - b.high) / pip, mitigated: false }
    }
    if (!zone) continue
    for (let j = i + 1; j < c.length; j++) {
      if (zone.side === 'BUY' ? c[j].low <= zone.low : c[j].high >= zone.high) {
        zone.mitigated = true
        break
      }
    }
    zones.push(zone)
  }
  return zones
}

function findOrderBlocks(c: Candle[], cfg: ICTStudioState['orderBlock']): Zone[] {
  const zones: Zone[] = []
  const recent = c.slice(-60)
  const avgBody = avg(recent.map(body))
  const avgVol = avg(recent.map((k) => k.volume ?? 0))
  const first = Math.max(1, c.length - Math.max(5, cfg.lookbackCandles))

  for (let i = first; i < c.length; i++) {
    const disp = c[i]
    if (body(disp) < 1.5 * avgBody) continue
    const bullish = disp.close > disp.open

    // Last opposite-colour candle just before the displacement leg.
    let j = -1
    for (let k = i - 1; k >= Math.max(0, i - 5); k--) {
      if (bullish ? c[k].close < c[k].open : c[k].close > c[k].open) {
        j = k
        break
      }
    }
    if (j < 0) continue
    const ob = c[j]

    // Displacement must take out the block's extreme (structure break).
    if (bullish ? disp.close <= ob.high : disp.close >= ob.low) continue
    if (cfg.requireBodyEngulf && (bullish ? !(disp.close >= ob.open && disp.open <= ob.close) : !(disp.close <= ob.open && disp.open >= ob.close))) continue
    if (cfg.volumeMultiplier > 1 && avgVol > 0 && disp.volume !== undefined && disp.volume < cfg.volumeMultiplier * avgVol) continue

    const zone: Zone = {
      index: j,
      low: ob.low,
      high: ob.high,
      side: bullish ? 'BUY' : 'SELL',
      sizePips: 0,
      mitigated: false,
    }
    // A block is mitigated once price closes through it.
    for (let k = i + 1; k < c.length; k++) {
      if (bullish ? c[k].close < zone.low : c[k].close > zone.high) {
        zone.mitigated = true
        break
      }
    }
    zones.push(zone)
  }
  return zones
}

const DAY_MS = 86_400_000

function utcHour(t: number): number {
  return new Date(t).getUTCHours() + new Date(t).getUTCMinutes() / 60
}

/** Session windows in UTC hours (New York ICT killzones, standard-time offsets). */
const SESSIONS: Record<Exclude<ICTStudioState['killzone']['activeSession'], 'all'>, [number, number]> = {
  asian_range: [1, 5],
  london_open: [7, 10],
  ny_am: [12, 15],
  ny_pm: [18.5, 21],
}

export function inKillzone(time: number, session: ICTStudioState['killzone']['activeSession']): boolean {
  const h = utcHour(time)
  const windows = session === 'all' ? Object.values(SESSIONS) : [SESSIONS[session]]
  return windows.some(([a, b]) => h >= a && h < b)
}

/** Previous UTC day's high/low and the current day's Asian-range extremes. */
function referenceLevels(c: Candle[], cfg: ICTStudioState['liquiditySweep']) {
  const last = c[c.length - 1]
  const today = Math.floor(last.time / DAY_MS)
  const prev = c.filter((k) => Math.floor(k.time / DAY_MS) === today - 1)
  const asian = c.filter((k) => Math.floor(k.time / DAY_MS) === today && utcHour(k.time) >= 0 && utcHour(k.time) < 5)
  const highs: Array<{ price: number; label: string }> = []
  const lows: Array<{ price: number; label: string }> = []
  if (cfg.sweepPreviousDayHighLow && prev.length) {
    highs.push({ price: Math.max(...prev.map((k) => k.high)), label: 'previous-day high' })
    lows.push({ price: Math.min(...prev.map((k) => k.low)), label: 'previous-day low' })
  }
  // Only meaningful once the Asian session has finished.
  if (cfg.sweepAsianRange && asian.length && utcHour(last.time) >= 5) {
    highs.push({ price: Math.max(...asian.map((k) => k.high)), label: 'Asian-range high' })
    lows.push({ price: Math.min(...asian.map((k) => k.low)), label: 'Asian-range low' })
  }
  return { highs, lows }
}

// ---------------------------------------------------------------------------
// Per-side analysis
// ---------------------------------------------------------------------------

function analyzeSide(
  side: Side,
  c: Candle[],
  state: ICTStudioState,
  ctx: { pip: number; atr: number; swings: Swing[]; fvgs: Zone[]; obs: Zone[]; window: number },
): SideAnalysis {
  const buy = side === 'BUY'
  const last = c[c.length - 1]
  const n = c.length
  const { pip, atr, swings, fvgs, obs, window } = ctx
  const signals: ConceptSignal[] = []
  const stopAnchors: number[] = []
  const price = last.close
  const avgBody = avg(c.slice(-50).map(body))

  // 1. Fair Value Gap ------------------------------------------------------
  if (state.fvg.enabled) {
    const cfg = state.fvg
    const allowed = cfg.direction === 'auto' || (buy ? cfg.direction === 'bullish_bisi' : cfg.direction === 'bearish_sibi')
    const zone = allowed
      ? [...fvgs]
          .reverse()
          .find(
            (z) =>
              z.side === side &&
              z.index >= n - window * 2 &&
              z.sizePips >= cfg.minSizePips &&
              (!cfg.unmitigatedOnly || !z.mitigated),
          )
      : undefined
    signals.push({
      id: 'fvg',
      name: 'Fair Value Gap',
      weight: cfg.weight,
      hit: !!zone,
      detail: zone
        ? `${buy ? 'Bullish' : 'Bearish'} FVG ${zone.sizePips.toFixed(1)}p ${zone.low.toFixed(5)}–${zone.high.toFixed(5)}${zone.mitigated ? ' (mitigated)' : ''}`
        : allowed
          ? `No ${cfg.unmitigatedOnly ? 'unmitigated ' : ''}${buy ? 'bullish' : 'bearish'} FVG ≥ ${cfg.minSizePips}p`
          : 'Disabled for this direction',
    })
  }

  // 2. Order Block ---------------------------------------------------------
  if (state.orderBlock.enabled) {
    const cfg = state.orderBlock
    const allowed = cfg.direction === 'auto' || (buy ? cfg.direction === 'bullish' : cfg.direction === 'bearish')
    // Active = unmitigated and price has returned to (or within 1 ATR of) the block.
    const zone = allowed
      ? [...obs]
          .reverse()
          .find((z) => z.side === side && !z.mitigated && (buy ? price <= z.high + atr : price >= z.low - atr))
      : undefined
    if (zone) stopAnchors.push(buy ? zone.low : zone.high)
    signals.push({
      id: 'order_block',
      name: 'Order Block',
      weight: cfg.weight,
      hit: !!zone,
      detail: zone
        ? `${buy ? 'Bullish' : 'Bearish'} OB ${zone.low.toFixed(5)}–${zone.high.toFixed(5)}, price retesting`
        : allowed
          ? `No unmitigated ${buy ? 'bullish' : 'bearish'} OB near price`
          : 'Disabled for this direction',
    })
  }

  // 3. Liquidity sweep -----------------------------------------------------
  if (state.liquiditySweep.enabled) {
    const cfg = state.liquiditySweep
    const allowed = cfg.poolType === 'both' || (buy ? cfg.poolType === 'ssl' : cfg.poolType === 'bsl')
    let found: { label: string; wick: number; index: number } | undefined
    if (allowed) {
      const ref = referenceLevels(c, cfg)
      const levels = (buy ? swings.filter((s) => s.type === 'low') : swings.filter((s) => s.type === 'high'))
        .filter((s) => s.index >= n - 80)
        .map((s) => ({ price: s.price, label: `swing ${buy ? 'low' : 'high'}`, at: s.index }))
        .concat((buy ? ref.lows : ref.highs).map((r) => ({ ...r, at: -1 })))
      for (let t = n - 1; t >= n - window && !found; t--) {
        for (const lv of levels) {
          if (lv.at >= t) continue
          const swept = buy ? c[t].low < lv.price && c[t].close > lv.price : c[t].high > lv.price && c[t].close < lv.price
          if (swept) {
            found = { label: lv.label, wick: buy ? c[t].low : c[t].high, index: t }
            break
          }
        }
      }
    }
    if (found) {
      stopAnchors.push(found.wick)
    }
    signals.push({
      id: 'liquidity_sweep',
      name: 'Liquidity Sweep',
      weight: cfg.weight,
      hit: !!found,
      detail: found
        ? `${buy ? 'SSL' : 'BSL'} swept (${found.label} @ ${found.wick.toFixed(5)}) ${n - 1 - found.index} candle(s) ago, closed back inside`
        : allowed
          ? `No ${buy ? 'sell-side' : 'buy-side'} liquidity sweep in last ${window} candles`
          : `Pool type ${cfg.poolType.toUpperCase()} excludes ${buy ? 'SSL' : 'BSL'}`,
    })
  }

  // Dealing-range anchor shared by MSS and OTE: the extreme of the last 30 candles.
  const recent = c.slice(-30)
  const base = n - recent.length
  const extreme = buy
    ? recent.reduce((m, k, i) => (k.low < recent[m].low ? i : m), 0) + base
    : recent.reduce((m, k, i) => (k.high > recent[m].high ? i : m), 0) + base

  // 4. Market structure shift ---------------------------------------------
  if (state.mss.enabled) {
    const cfg = state.mss
    const prior = swings.filter((s) => s.type === (buy ? 'high' : 'low') && s.index < extreme)
    const level = prior.length ? prior[prior.length - 1] : undefined
    let breaker = -1
    if (level) {
      for (let j = extreme + 1; j < n; j++) {
        const through = buy
          ? (cfg.requireBodyClose ? c[j].close : c[j].high) > level.price
          : (cfg.requireBodyClose ? c[j].close : c[j].low) < level.price
        if (through) {
          breaker = j
          break
        }
      }
    }
    let ok = breaker >= 0
    const notes: string[] = []
    if (ok && cfg.confirmDisplacement) {
      const strong = body(c[breaker]) >= 1.2 * avgBody
      if (!strong) ok = false
      notes.push(strong ? 'displacement confirmed' : 'weak break, no displacement')
    }
    if (ok && cfg.multiTimeframeAlign) {
      // Higher timeframe proxy: 4:1 resample, price must sit on the right side of its 5-bar mean.
      const htf: number[] = []
      for (let i = n - 1; i >= 3 && htf.length < 5; i -= 4) htf.push(c[i].close)
      const aligned = htf.length < 3 || (buy ? htf[0] >= avg(htf) : htf[0] <= avg(htf))
      if (!aligned) ok = false
      notes.push(aligned ? 'HTF aligned' : 'HTF against')
    }
    signals.push({
      id: 'mss',
      name: 'Market Structure Shift',
      weight: cfg.weight,
      hit: ok,
      detail: level
        ? ok
          ? `${buy ? 'Bullish' : 'Bearish'} MSS: ${cfg.requireBodyClose ? 'body close' : 'wick'} through ${level.price.toFixed(5)}${notes.length ? ` (${notes.join(', ')})` : ''}`
          : `Level ${level.price.toFixed(5)} ${breaker >= 0 ? `broken but ${notes.join(', ')}` : 'not broken yet'}`
        : 'No prior swing to break',
    })
  }

  // 5. Optimal trade entry -------------------------------------------------
  if (state.ote.enabled) {
    const cfg = state.ote
    let hit = false
    let detail = 'No qualifying impulse leg'
    // Impulse leg runs from the extreme to the opposite extreme that followed it.
    const after = c.slice(extreme + 1)
    if (after.length >= 2) {
      const legEnd = buy ? Math.max(...after.map((k) => k.high)) : Math.min(...after.map((k) => k.low))
      const legStart = buy ? c[extreme].low : c[extreme].high
      const range = Math.abs(legEnd - legStart)
      if (range >= atr) {
        const retr = buy ? (legEnd - price) / range : (price - legEnd) / range
        const [lo, hi] = cfg.fibZone === '0.705_sweet_spot' ? [0.67, 0.74] : [0.62, 0.79]
        const discount = retr > 0.5
        hit = retr >= lo && retr <= hi && (!cfg.targetDiscountZone || discount)
        detail = `Retracement ${(retr * 100).toFixed(1)}% of ${(range / pip).toFixed(0)}p leg (zone ${lo}–${hi})${hit ? '' : ' – outside zone'}`
        if (hit) stopAnchors.push(legStart)
      }
    }
    signals.push({ id: 'ote', name: 'Optimal Trade Entry', weight: cfg.weight, hit, detail })
  }

  // 6. Killzone ------------------------------------------------------------
  let blockedBy: string | undefined
  if (state.killzone.enabled) {
    const cfg = state.killzone
    const hit = inKillzone(last.time, cfg.activeSession)
    if (!hit && cfg.strictTimeFilter) blockedBy = `Outside ${cfg.activeSession.replace('_', ' ')} killzone (strict time filter)`
    signals.push({
      id: 'killzone',
      name: 'Killzone',
      weight: cfg.weight,
      hit,
      detail: `${new Date(last.time).toISOString().slice(11, 16)} UTC ${hit ? 'inside' : 'outside'} ${cfg.activeSession.replace('_', ' ')}`,
    })
  }

  const total = signals.reduce((a, s) => a + s.weight, 0)
  const got = signals.filter((s) => s.hit).reduce((a, s) => a + s.weight, 0)
  return { side, signals, score: total > 0 ? Math.round((got / total) * 1000) / 10 : 0, stopAnchors, blockedBy }
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

function neutral(price: number, reason: string, started: number): ConfluenceEvaluationResult {
  return {
    confluenceScore: 0,
    direction: 'NEUTRAL',
    shouldExecute: false,
    entryPrice: price,
    stopLoss: 0,
    takeProfit: 0,
    riskRewardRatio: '–',
    executionLatencyUs: elapsedUs(started),
    compiledAt: new Date().toLocaleTimeString(),
    triggeredConcepts: [],
    compilerLog: `ICT engine: ${reason}`,
    blockedBy: reason,
    scores: { buy: 0, sell: 0 },
    candlesAnalyzed: 0,
    signals: [],
  }
}

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now())
const elapsedUs = (started: number) => Math.max(0.01, Number(((now() - started) * 1000).toFixed(2)))

export function analyzeICT(candlesIn: Candle[], state: ICTStudioState, opts: AnalyzeOptions = {}): ConfluenceEvaluationResult {
  const started = now()
  const c = candlesIn
  if (c.length < MIN_CANDLES) {
    return neutral(c.length ? c[c.length - 1].close : 0, `need at least ${MIN_CANDLES} candles, got ${c.length}`, started)
  }

  const last = c[c.length - 1]
  const pip = opts.pipSize ?? inferPip(last.close)
  const atr = computeATR(c)
  const ctx = {
    pip,
    atr,
    swings: findSwings(c, opts.swingStrength ?? 2),
    fvgs: findFVGs(c, pip),
    obs: findOrderBlocks(c, state.orderBlock),
    window: opts.recentWindow ?? 10,
  }

  const buy = analyzeSide('BUY', c, state, ctx)
  const sell = analyzeSide('SELL', c, state, ctx)
  const winner = buy.score === sell.score ? null : buy.score > sell.score ? buy : sell
  const chosen = winner ?? buy
  const score = winner ? winner.score : Math.max(buy.score, sell.score)

  let blockedBy = winner ? winner.blockedBy : undefined
  if (!winner) blockedBy = 'BUY and SELL confluence are tied'
  else if (score < state.minConfluenceThreshold) blockedBy = `Score ${score}% below threshold ${state.minConfluenceThreshold}%`

  const shouldExecute = !!winner && !blockedBy
  const direction: ConfluenceEvaluationResult['direction'] = shouldExecute ? winner!.side : 'NEUTRAL'

  // Risk model: structural stop beyond the sweep / block / leg origin, target at opposing liquidity.
  const entry = last.close
  const isBuy = chosen.side === 'BUY'
  const buffer = 0.25 * atr
  const anchor = chosen.stopAnchors.length ? (isBuy ? Math.min(...chosen.stopAnchors) : Math.max(...chosen.stopAnchors)) : undefined
  let stop = anchor !== undefined ? (isBuy ? anchor - buffer : anchor + buffer) : isBuy ? entry - 1.5 * atr : entry + 1.5 * atr
  // Never let the stop sit on the wrong side or be absurdly tight.
  if (isBuy ? stop >= entry - 0.5 * atr : stop <= entry + 0.5 * atr) stop = isBuy ? entry - 1.5 * atr : entry + 1.5 * atr
  const risk = Math.abs(entry - stop)
  const liquidity = ctx.swings
    .filter((s) => (isBuy ? s.type === 'high' && s.price > entry : s.type === 'low' && s.price < entry))
    .sort((a, b) => (isBuy ? a.price - b.price : b.price - a.price))
    .find((s) => Math.abs(s.price - entry) >= 1.5 * risk)
  const target = liquidity ? liquidity.price : isBuy ? entry + 2.5 * risk : entry - 2.5 * risk
  const rr = risk > 0 ? Math.abs(target - entry) / risk : 0

  const hits = chosen.signals.filter((s) => s.hit)
  const dp = pip < 0.001 ? 5 : pip < 0.05 ? 3 : 2
  return {
    confluenceScore: score,
    direction,
    shouldExecute,
    entryPrice: Number(entry.toFixed(dp)),
    stopLoss: Number(stop.toFixed(dp)),
    takeProfit: Number(target.toFixed(dp)),
    riskRewardRatio: `1:${rr.toFixed(2)}`,
    executionLatencyUs: elapsedUs(started),
    compiledAt: new Date().toLocaleTimeString(),
    triggeredConcepts: hits.map((s) => s.name),
    compilerLog: `ICT engine (${c.length} candles): BUY ${buy.score}% / SELL ${sell.score}% → ${
      shouldExecute ? `${direction} authorised` : `HOLD (${blockedBy})`
    }`,
    signals: chosen.signals,
    scores: { buy: buy.score, sell: sell.score },
    candlesAnalyzed: c.length,
    blockedBy,
  }
}
