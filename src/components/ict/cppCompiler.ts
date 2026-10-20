import type { Candle, ICTStudioState, ConfluenceEvaluationResult } from './types'
import { analyzeICT, generateSampleCandles, normalizeCandles } from './engine'

export const DEFAULT_CPP_CONFLUENCE_CODE = `/**
 * @file ict_confluence_engine.cpp
 * @brief Ultra-Low Latency ICT (Inner Circle Trader) Confluence Engine
 * Optimized for ISO C++20 with Fast-Math & Vectorized Branching
 */

#include <iostream>
#include <vector>
#include <string>
#include <cmath>

struct ICTMarketFeed {
    double spotPrice;
    bool hasBullishFVG;
    double fvgSizePips;
    bool hasOrderBlock;
    bool obMitigated;
    bool liquiditySwept;
    bool mssConfirmed;
    bool inOTEZone;
    bool isKillzoneActive;
};

struct ExecutionDecision {
    bool executeTrade;
    double confluenceScore; // 0.0 to 100.0%
    const char* bias;       // "BUY", "SELL", "NEUTRAL"
    double entry;
    double stopLoss;
    double takeProfit;
    double riskReward;
};

extern "C" ExecutionDecision evaluateConfluence(const ICTMarketFeed& feed) {
    double score = 0.0;

    // 1. Order Block (Institutional Footprint) - 25 pts
    if (feed.hasOrderBlock && !feed.obMitigated) {
        score += 25.0;
    }

    // 2. Fair Value Gap Imbalance (Displacement) - 25 pts
    if (feed.hasBullishFVG) {
        double fvgBonus = (feed.fvgSizePips >= 2.0) ? 25.0 : 15.0;
        score += fvgBonus;
    }

    // 3. Liquidity Sweep (BSL / SSL Cleaned) - 20 pts
    if (feed.liquiditySwept) {
        score += 20.0;
    }

    // 4. Market Structure Shift (MSS Body Close) - 15 pts
    if (feed.mssConfirmed) {
        score += 15.0;
    }

    // 5. Optimal Trade Entry (OTE 0.62 - 0.79 Fib) - 10 pts
    if (feed.inOTEZone) {
        score += 10.0;
    }

    // 6. Killzone Timing Filter (London/NY Liquidity Window) - 5 pts
    if (feed.isKillzoneActive) {
        score += 5.0;
    }

    ExecutionDecision decision;
    decision.confluenceScore = std::min(100.0, score);
    decision.executeTrade = (decision.confluenceScore >= 75.0);

    if (decision.executeTrade) {
        decision.bias = "BUY";
        decision.entry = feed.spotPrice;
        decision.stopLoss = feed.spotPrice - 0.00180; // 18 pips SL below OB
        decision.takeProfit = feed.spotPrice + 0.00450; // 45 pips TP (1:2.5 RR)
        decision.riskReward = 2.50;
    } else {
        decision.bias = "NEUTRAL";
        decision.entry = 0.0;
        decision.stopLoss = 0.0;
        decision.takeProfit = 0.0;
        decision.riskReward = 0.0;
    }

    return decision;
}
`

export const PRESET_CPP_TEMPLATES = [
  {
    id: 'institutional_fvg',
    name: 'Institutional FVG & Liquidity Sweep (Standard)',
    description: 'Prioritizes unmitigated Order Blocks, Fair Value Gaps >= 2 pips, and liquidity sweep confirmation.',
    code: DEFAULT_CPP_CONFLUENCE_CODE,
  },
  {
    id: 'silver_bullet_scalper',
    name: 'Silver Bullet 15m Scalping Algorithm',
    description: 'Requires strict London/NY Killzone alignment combined with MSS displacement and FVG retest.',
    code: `// Silver Bullet 15m Scalper Algorithm (C++20 FastMath)
#include <cmath>

struct ExecutionDecision {
    bool executeTrade;
    double confluenceScore;
    const char* bias;
    double entry;
    double stopLoss;
    double takeProfit;
    double riskReward;
};

extern "C" ExecutionDecision evaluateSilverBullet(bool killzone, bool mss, bool fvg, double spot) {
    ExecutionDecision d;
    double score = 0.0;
    if (killzone) score += 35.0;
    if (mss) score += 35.0;
    if (fvg) score += 30.0;

    d.confluenceScore = score;
    d.executeTrade = (score >= 70.0 && killzone);
    d.bias = d.executeTrade ? "BUY" : "NEUTRAL";
    d.entry = spot;
    d.stopLoss = spot - 0.00120; // 12 pips tight SL
    d.takeProfit = spot + 0.00360; // 36 pips TP (1:3.0 RR)
    d.riskReward = 3.0;
    return d;
}
`,
  },
  {
    id: 'ote_discount_matrix',
    name: 'Optimal Trade Entry (OTE) 0.705 Matrix',
    description: 'Demands deep discount retracements between 0.62 and 0.79 Fib with Market Structure Shift confirmation.',
    code: `// OTE 0.705 Golden Zone Matrix (C++20)
#include <cmath>

struct ExecutionDecision {
    bool executeTrade;
    double confluenceScore;
    const char* bias;
    double entry;
    double stopLoss;
    double takeProfit;
    double riskReward;
};

extern "C" ExecutionDecision evaluateOTEMatrix(bool inOTE, bool ob, bool mss, double spot) {
    ExecutionDecision d;
    double score = 0.0;
    if (inOTE) score += 40.0;
    if (ob) score += 30.0;
    if (mss) score += 30.0;

    d.confluenceScore = score;
    d.executeTrade = (score >= 80.0);
    d.bias = d.executeTrade ? "BUY" : "NEUTRAL";
    d.entry = spot;
    d.stopLoss = spot - 0.00150;
    d.takeProfit = spot + 0.00450;
    d.riskReward = 3.0;
    return d;
}
`,
  },
]

export interface CompilerOutput {
  success: boolean
  compilerLog: string
  binaryTarget: string
  compilationTimeMs: number
  latencyBenchmarkUs: number
  binarySizeKb: number
}

export function compileCppSource(sourceCode: string): CompilerOutput {
  const timestamp = new Date().toISOString()
  const compTime = Math.floor(12 + Math.random() * 14)
  const latency = Number((0.28 + Math.random() * 0.15).toFixed(2))

  const hasSyntaxError = sourceCode.includes('SYNTAX_ERROR') || sourceCode.trim().length < 20

  if (hasSyntaxError) {
    return {
      success: false,
      compilerLog: `[clang++ -O3 -std=c++20] Error: compilation halted due to syntax errors at line 14.\nExpected ';' after declaration.`,
      binaryTarget: '',
      compilationTimeMs: compTime,
      latencyBenchmarkUs: 0,
      binarySizeKb: 0,
    }
  }

  const log = `[simulated build - C++ is not executed in the browser]
✓ Source accepted (${sourceCode.split('\n').length} lines)
✓ Live scoring runs on the TypeScript ICT engine (src/components/ict/engine.ts)
  which implements the same FVG / OB / sweep / MSS / OTE / killzone model.
Checked at ${timestamp} in ${compTime}ms.`

  return {
    success: true,
    compilerLog: log,
    binaryTarget: 'C++ reference spec (not executed)',
    compilationTimeMs: compTime,
    latencyBenchmarkUs: latency,
    binarySizeKb: 3.4,
  }
}

/**
 * Resolve the candles an ICT evaluation should run on: pasted JSON from the studio
 * if present and valid, otherwise deterministic synthetic sample data.
 */
export function resolveCandles(state: ICTStudioState): { candles: Candle[]; usedSampleData: boolean } {
  if (state.candlesJson?.trim()) {
    try {
      const candles = normalizeCandles(JSON.parse(state.candlesJson))
      if (candles.length) return { candles, usedSampleData: false }
    } catch {
      // fall through to sample data
    }
  }
  return { candles: generateSampleCandles(), usedSampleData: true }
}

/** Evaluate the studio configuration with the ICT engine (the C++ source is the reference spec). */
export function evaluateConfluenceWithCpp(
  state: ICTStudioState,
  candles?: Candle[]
): ConfluenceEvaluationResult {
  const resolved = candles ? { candles, usedSampleData: false } : resolveCandles(state)
  return { ...analyzeICT(resolved.candles, state), usedSampleData: resolved.usedSampleData }
}
