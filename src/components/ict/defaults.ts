import type { ICTStudioState } from './types'
import { DEFAULT_CPP_CONFLUENCE_CODE } from './cppCompiler'

/** Shared by the canvas node and the server-side executor. */
export function createDefaultICTState(): ICTStudioState {
  return {
    fvg: { enabled: true, direction: 'auto', timeframe: '15m', minSizePips: 2.5, unmitigatedOnly: true, weight: 25 },
    orderBlock: {
      enabled: true,
      direction: 'auto',
      lookbackCandles: 20,
      volumeMultiplier: 1.8,
      requireBodyEngulf: true,
      weight: 25,
    },
    liquiditySweep: {
      enabled: true,
      poolType: 'both',
      sweepAsianRange: true,
      sweepPreviousDayHighLow: true,
      weight: 20,
    },
    mss: { enabled: true, requireBodyClose: true, confirmDisplacement: true, multiTimeframeAlign: true, weight: 15 },
    ote: { enabled: true, fibZone: '0.705_sweet_spot', targetDiscountZone: true, weight: 10 },
    killzone: { enabled: true, activeSession: 'all', strictTimeFilter: true, weight: 5 },
    cppSource: DEFAULT_CPP_CONFLUENCE_CODE,
    minConfluenceThreshold: 75,
  }
}
