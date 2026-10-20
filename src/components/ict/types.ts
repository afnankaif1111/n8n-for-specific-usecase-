export type ICTConceptType = 'fvg' | 'order_block' | 'liquidity_sweep' | 'mss' | 'ote' | 'killzone'

export interface Candle {
  /** Unix epoch in milliseconds */
  time: number
  open: number
  high: number
  low: number
  close: number
  volume?: number
}

export interface FVGState {
  enabled: boolean
  /** `auto` lets the engine score whichever side has a valid gap */
  direction: 'auto' | 'bullish_bisi' | 'bearish_sibi'
  timeframe: string
  minSizePips: number
  unmitigatedOnly: boolean
  weight: number
}

export interface OrderBlockState {
  enabled: boolean
  direction: 'auto' | 'bullish' | 'bearish'
  lookbackCandles: number
  volumeMultiplier: number
  requireBodyEngulf: boolean
  weight: number
}

export interface LiquiditySweepState {
  enabled: boolean
  poolType: 'bsl' | 'ssl' | 'both'
  sweepAsianRange: boolean
  sweepPreviousDayHighLow: boolean
  weight: number
}

export interface MSSState {
  enabled: boolean
  requireBodyClose: boolean
  confirmDisplacement: boolean
  multiTimeframeAlign: boolean
  weight: number
}

export interface OTEState {
  enabled: boolean
  fibZone: '0.62_to_0.79' | '0.705_sweet_spot'
  targetDiscountZone: boolean
  weight: number
}

export interface KillzoneState {
  enabled: boolean
  activeSession: 'london_open' | 'ny_am' | 'ny_pm' | 'asian_range' | 'all'
  /** When true, a trade is blocked outside the session no matter the score */
  strictTimeFilter: boolean
  weight: number
}

export interface ICTStudioState {
  fvg: FVGState
  orderBlock: OrderBlockState
  liquiditySweep: LiquiditySweepState
  mss: MSSState
  ote: OTEState
  killzone: KillzoneState
  cppSource: string
  minConfluenceThreshold: number
  /** Optional candles pasted into the studio (JSON). Used when no upstream node supplies data. */
  candlesJson?: string
}

export interface ConceptSignal {
  id: ICTConceptType
  name: string
  hit: boolean
  weight: number
  detail: string
}

export interface ConfluenceEvaluationResult {
  confluenceScore: number // 0 to 100%
  direction: 'BUY' | 'SELL' | 'NEUTRAL'
  shouldExecute: boolean
  entryPrice: number
  stopLoss: number
  takeProfit: number
  riskRewardRatio: string
  executionLatencyUs: number // measured wall-clock time of the evaluation
  compiledAt: string
  triggeredConcepts: string[]
  compilerLog: string
  /** Per-concept breakdown for the chosen side */
  signals?: ConceptSignal[]
  scores?: { buy: number; sell: number }
  candlesAnalyzed?: number
  /** True when no real candles were supplied and synthetic sample data was used */
  usedSampleData?: boolean
  blockedBy?: string
}
