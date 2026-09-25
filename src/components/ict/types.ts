export type ICTConceptType = 'fvg' | 'order_block' | 'liquidity_sweep' | 'mss' | 'ote' | 'killzone'

export interface FVGState {
  enabled: boolean
  direction: 'bullish_bisi' | 'bearish_sibi'
  timeframe: string
  minSizePips: number
  unmitigatedOnly: boolean
  weight: number
}

export interface OrderBlockState {
  enabled: boolean
  direction: 'bullish' | 'bearish'
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
}

export interface ConfluenceEvaluationResult {
  confluenceScore: number // 0 to 100%
  direction: 'BUY' | 'SELL' | 'NEUTRAL'
  shouldExecute: boolean
  entryPrice: number
  stopLoss: number
  takeProfit: number
  riskRewardRatio: string
  executionLatencyUs: number // e.g. 0.34 microseconds
  compiledAt: string
  triggeredConcepts: string[]
  compilerLog: string
}
