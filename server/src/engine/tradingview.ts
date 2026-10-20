/**
 * Normalises a TradingView alert body into the fields downstream nodes read.
 *
 * TradingView posts `application/json` when the alert message is valid JSON and
 * `text/plain` otherwise, so both are accepted. Common placeholders such as
 * {{ticker}}, {{close}}, {{strategy.order.action}} are mapped to stable keys.
 */
type Json = Record<string, unknown>

const num = (v: unknown): number | undefined => {
  if (typeof v === 'string') v = v.replace(/,/g, '').trim()
  const n = Number(v)
  return v !== '' && v !== null && v !== undefined && Number.isFinite(n) ? n : undefined
}

function pick(obj: Json, keys: string[]): unknown {
  for (const k of keys) if (obj[k] !== undefined && obj[k] !== null && obj[k] !== '') return obj[k]
  return undefined
}

function toDirection(v: unknown): 'BUY' | 'SELL' | undefined {
  const s = String(v ?? '').toLowerCase()
  if (/^(buy|long|bull|bullish)/.test(s)) return 'BUY'
  if (/^(sell|short|bear|bearish)/.test(s)) return 'SELL'
  return undefined
}

export function parseTradingViewBody(body: unknown): Json {
  let obj: Json = {}
  let text = ''

  if (typeof body === 'string') {
    text = body.trim()
    try {
      const parsed = JSON.parse(text)
      if (parsed && typeof parsed === 'object') obj = parsed as Json
    } catch {
      // free-text alert, e.g. "BUY EURUSD @ 1.0945"
    }
  } else if (body && typeof body === 'object') {
    obj = body as Json
  }

  if (!Object.keys(obj).length && text) {
    const direction = toDirection(text.match(/\b(buy|sell|long|short)\b/i)?.[1])
    const price = num(text.match(/@\s*([\d.,]+)/)?.[1])
    const skip = new Set(['BUY', 'SELL', 'LONG', 'SHORT', 'BULL', 'BEAR', 'ALERT', 'CLOSE'])
    const ticker = text.toUpperCase().match(/\b[A-Z]{3,6}(?:[:/][A-Z]{3,6})?\b/g)?.find((t) => !skip.has(t))?.replace(/^[A-Z_]+:/, '')
    return { source: 'tradingview', message: text, direction, price, asset: ticker, raw: text }
  }

  const asset = pick(obj, ['asset', 'symbol', 'ticker', 'pair'])
  const out: Json = {
    source: 'tradingview',
    asset: typeof asset === 'string' ? asset.replace(/^[A-Z_]+:/, '') : asset, // strip "OANDA:" style prefix
    price: num(pick(obj, ['price', 'close', 'entry'])),
    direction: toDirection(pick(obj, ['direction', 'action', 'side', 'signal', 'order_action'])),
    stopLoss: num(pick(obj, ['stopLoss', 'stop_loss', 'sl', 'stop'])),
    takeProfit: num(pick(obj, ['takeProfit', 'take_profit', 'tp', 'target'])),
    interval: pick(obj, ['interval', 'timeframe']),
    time: pick(obj, ['time', 'timenow']),
    message: pick(obj, ['message', 'comment']),
    raw: obj,
  }
  if (out.price !== undefined) out.entry = out.price
  if (Array.isArray(obj.candles)) out.candles = obj.candles
  for (const k of Object.keys(out)) if (out[k] === undefined) delete out[k]
  return out
}
