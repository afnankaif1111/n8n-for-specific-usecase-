import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  DEFAULT_CPP_CONFLUENCE_CODE,
  PRESET_CPP_TEMPLATES,
  compileCppSource,
  evaluateConfluenceWithCpp,
  type CompilerOutput,
} from './cppCompiler'
import type { ICTStudioState, ConfluenceEvaluationResult } from './types'
import {
  Cpu,
  Layers,
  Sparkles,
  Zap,
  CheckCircle2,
  Terminal,
  Activity,
  Flame,
  Clock,
  ArrowRight,
  ShieldCheck,
  Code2,
  TrendingUp,
} from 'lucide-react'

export interface ICTStudioModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialState?: Partial<ICTStudioState>
  onSave: (state: ICTStudioState, evaluation: ConfluenceEvaluationResult) => void
}

export function ICTStudioModal({
  open,
  onOpenChange,
  initialState,
  onSave,
}: ICTStudioModalProps) {
  const [activeTab, setActiveTab] = useState<'concepts' | 'cpp'>('concepts')

  // Concept states
  const [fvgEnabled, setFvgEnabled] = useState(initialState?.fvg?.enabled ?? true)
  const [fvgDirection, setFvgDirection] = useState<'bullish_bisi' | 'bearish_sibi'>(
    initialState?.fvg?.direction ?? 'bullish_bisi'
  )
  const [fvgMinSize, setFvgMinSize] = useState(initialState?.fvg?.minSizePips ?? 2.5)
  const [fvgWeight, setFvgWeight] = useState(initialState?.fvg?.weight ?? 25)

  const [obEnabled, setObEnabled] = useState(initialState?.orderBlock?.enabled ?? true)
  const [obDirection, setObDirection] = useState<'bullish' | 'bearish'>(
    initialState?.orderBlock?.direction ?? 'bullish'
  )
  const [obWeight, setObWeight] = useState(initialState?.orderBlock?.weight ?? 25)

  const [sweepEnabled, setSweepEnabled] = useState(initialState?.liquiditySweep?.enabled ?? true)
  const [sweepPool, setSweepPool] = useState<'bsl' | 'ssl' | 'both'>(
    initialState?.liquiditySweep?.poolType ?? 'ssl'
  )
  const [sweepWeight, setSweepWeight] = useState(initialState?.liquiditySweep?.weight ?? 20)

  const [mssEnabled, setMssEnabled] = useState(initialState?.mss?.enabled ?? true)
  const [mssWeight, setMssWeight] = useState(initialState?.mss?.weight ?? 15)

  const [oteEnabled, setOteEnabled] = useState(initialState?.ote?.enabled ?? true)
  const [oteWeight, setOteWeight] = useState(initialState?.ote?.weight ?? 10)

  const [kzEnabled, setKzEnabled] = useState(initialState?.killzone?.enabled ?? true)
  const [kzWeight, setKzWeight] = useState(initialState?.killzone?.weight ?? 5)

  const [threshold, setThreshold] = useState(initialState?.minConfluenceThreshold ?? 75)

  // C++ Engine states
  const [cppCode, setCppCode] = useState(initialState?.cppSource || DEFAULT_CPP_CONFLUENCE_CODE)
  const [compilerOutput, setCompilerOutput] = useState<CompilerOutput | null>(() =>
    compileCppSource(cppCode)
  )
  const [isCompiling, setIsCompiling] = useState(false)
  const [evalResult, setEvalResult] = useState<ConfluenceEvaluationResult | null>(null)

  const buildStudioState = (): ICTStudioState => ({
    fvg: {
      enabled: fvgEnabled,
      direction: fvgDirection,
      timeframe: '15m',
      minSizePips: fvgMinSize,
      unmitigatedOnly: true,
      weight: fvgWeight,
    },
    orderBlock: {
      enabled: obEnabled,
      direction: obDirection,
      lookbackCandles: 20,
      volumeMultiplier: 1.8,
      requireBodyEngulf: true,
      weight: obWeight,
    },
    liquiditySweep: {
      enabled: sweepEnabled,
      poolType: sweepPool,
      sweepAsianRange: true,
      sweepPreviousDayHighLow: true,
      weight: sweepWeight,
    },
    mss: {
      enabled: mssEnabled,
      requireBodyClose: true,
      confirmDisplacement: true,
      multiTimeframeAlign: true,
      weight: mssWeight,
    },
    ote: {
      enabled: oteEnabled,
      fibZone: '0.705_sweet_spot',
      targetDiscountZone: true,
      weight: oteWeight,
    },
    killzone: {
      enabled: kzEnabled,
      activeSession: 'ny_am',
      strictTimeFilter: true,
      weight: kzWeight,
    },
    cppSource: cppCode,
    minConfluenceThreshold: threshold,
  })

  const handleCompileCpp = () => {
    setIsCompiling(true)
    setTimeout(() => {
      const output = compileCppSource(cppCode)
      setCompilerOutput(output)
      setIsCompiling(false)

      // Automatically evaluate state with newly compiled C++ logic
      const state = buildStudioState()
      const res = evaluateConfluenceWithCpp(state)
      setEvalResult(res)
    }, 250)
  }

  const handleRunEvaluation = () => {
    const state = buildStudioState()
    const res = evaluateConfluenceWithCpp(state)
    setEvalResult(res)
  }

  const handleApplyPreset = (templateId: string) => {
    const found = PRESET_CPP_TEMPLATES.find((t) => t.id === templateId)
    if (found) {
      setCppCode(found.code)
      setCompilerOutput(compileCppSource(found.code))
    }
  }

  const handleSaveAndApply = () => {
    const state = buildStudioState()
    const evaluation = evalResult || evaluateConfluenceWithCpp(state)
    onSave(state, evaluation)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-5xl h-[88vh] max-h-[850px] p-0 flex flex-col bg-card border-border overflow-hidden text-left">
        {/* Header */}
        <DialogHeader className="p-4 sm:px-6 border-b border-border bg-muted/20 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-500 flex items-center justify-center shadow-sm">
                <Flame className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
                  <span>Smart ICT Sub-Canvas Studio &amp; C++ Confluence Manager</span>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                    C++20 SIMD Engine
                  </span>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Visually configure institutional ICT concepts (FVG, Order Block, Sweeps, MSS, OTE) and link them to compiled high-speed C++ logic.
                </DialogDescription>
              </div>
            </div>

            {/* Top Navigation Tabs */}
            <div className="flex items-center rounded-lg border border-border bg-background p-1 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('concepts')}
                className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'concepts'
                    ? 'bg-amber-500 text-black shadow-sm font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>1. ICT Sub-Canvas</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('cpp')}
                className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'cpp'
                    ? 'bg-amber-500 text-black shadow-sm font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Code2 className="h-3.5 w-3.5" />
                <span>2. C++ Confluence Manager</span>
              </button>
            </div>
          </div>
        </DialogHeader>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {activeTab === 'concepts' ? (
            /* Sub-Canvas Visual Concepts Layout */
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground pb-1 border-b border-border/60">
                <span className="font-semibold text-foreground">
                  Active ICT Modular Concept Blocks (6 Available)
                </span>
                <span>
                  Configure weights &amp; rules. All concept states feed directly into the C++ compiler.
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {/* 1. Fair Value Gap (FVG) Card */}
                <div
                  className={`p-3.5 rounded-xl border-2 transition-all ${
                    fvgEnabled
                      ? 'border-indigo-500/50 bg-indigo-500/5'
                      : 'border-border bg-card/60 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-border/50">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-indigo-500/10 text-indigo-500 border border-indigo-500/30 flex items-center justify-center font-bold text-xs">
                        FVG
                      </div>
                      <div>
                        <div className="text-xs font-bold text-foreground">Fair Value Gap</div>
                        <div className="text-[10px] text-muted-foreground">Displacement Imbalance</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={fvgEnabled}
                      onChange={(e) => setFvgEnabled(e.target.checked)}
                      className="h-4 w-4 rounded text-indigo-600 cursor-pointer"
                    />
                  </div>

                  <div className="pt-2.5 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground">Type:</span>
                      <select
                        value={fvgDirection}
                        onChange={(e) => setFvgDirection(e.target.value as any)}
                        className="text-xs rounded border border-border bg-background px-2 py-0.5"
                      >
                        <option value="bullish_bisi">BISI (Bullish)</option>
                        <option value="bearish_sibi">SIBI (Bearish)</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground">Min Gap Size:</span>
                      <span className="font-mono font-semibold text-foreground">{fvgMinSize} pips</span>
                    </div>
                    <input
                      type="range"
                      min={0.5}
                      max={8.0}
                      step={0.5}
                      value={fvgMinSize}
                      onChange={(e) => setFvgMinSize(Number.parseFloat(e.target.value))}
                      className="w-full accent-indigo-500"
                    />

                    <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[10px] text-muted-foreground">
                      <span>C++ Confluence Weight:</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={5}
                          max={50}
                          value={fvgWeight}
                          onChange={(e) => setFvgWeight(Number.parseInt(e.target.value) || 0)}
                          className="w-12 text-[10px] font-mono font-bold text-right px-1 py-0.5 rounded border border-border bg-background"
                        />
                        <span>pts</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Order Block (OB) Card */}
                <div
                  className={`p-3.5 rounded-xl border-2 transition-all ${
                    obEnabled
                      ? 'border-emerald-500/50 bg-emerald-500/5'
                      : 'border-border bg-card/60 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-border/50">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 flex items-center justify-center font-bold text-xs">
                        OB
                      </div>
                      <div>
                        <div className="text-xs font-bold text-foreground">Order Block</div>
                        <div className="text-[10px] text-muted-foreground">Institutional Footprint</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={obEnabled}
                      onChange={(e) => setObEnabled(e.target.checked)}
                      className="h-4 w-4 rounded text-emerald-600 cursor-pointer"
                    />
                  </div>

                  <div className="pt-2.5 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground">Direction:</span>
                      <select
                        value={obDirection}
                        onChange={(e) => setObDirection(e.target.value as any)}
                        className="text-xs rounded border border-border bg-background px-2 py-0.5"
                      >
                        <option value="bullish">Bullish Demand OB</option>
                        <option value="bearish">Bearish Supply OB</option>
                      </select>
                    </div>

                    <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                      <span>Unmitigated Only • 1.8x Volume Filter</span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[10px] text-muted-foreground">
                      <span>C++ Confluence Weight:</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={5}
                          max={50}
                          value={obWeight}
                          onChange={(e) => setObWeight(Number.parseInt(e.target.value) || 0)}
                          className="w-12 text-[10px] font-mono font-bold text-right px-1 py-0.5 rounded border border-border bg-background"
                        />
                        <span>pts</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Liquidity Sweep (BSL / SSL) */}
                <div
                  className={`p-3.5 rounded-xl border-2 transition-all ${
                    sweepEnabled
                      ? 'border-cyan-500/50 bg-cyan-500/5'
                      : 'border-border bg-card/60 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-border/50">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-cyan-500/10 text-cyan-500 border border-cyan-500/30 flex items-center justify-center font-bold text-xs">
                        BSL
                      </div>
                      <div>
                        <div className="text-xs font-bold text-foreground">Liquidity Sweep</div>
                        <div className="text-[10px] text-muted-foreground">Stops Hunt / Clean Sweep</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={sweepEnabled}
                      onChange={(e) => setSweepEnabled(e.target.checked)}
                      className="h-4 w-4 rounded text-cyan-600 cursor-pointer"
                    />
                  </div>

                  <div className="pt-2.5 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground">Pool Type:</span>
                      <select
                        value={sweepPool}
                        onChange={(e) => setSweepPool(e.target.value as any)}
                        className="text-xs rounded border border-border bg-background px-2 py-0.5"
                      >
                        <option value="ssl">SSL (Sell-Side Sweep)</option>
                        <option value="bsl">BSL (Buy-Side Sweep)</option>
                        <option value="both">Both Sessions</option>
                      </select>
                    </div>

                    <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5 text-cyan-500" />
                      <span>Asian Range &amp; PDH/PDL Sweep Guard</span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[10px] text-muted-foreground">
                      <span>C++ Confluence Weight:</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={5}
                          max={50}
                          value={sweepWeight}
                          onChange={(e) => setSweepWeight(Number.parseInt(e.target.value) || 0)}
                          className="w-12 text-[10px] font-mono font-bold text-right px-1 py-0.5 rounded border border-border bg-background"
                        />
                        <span>pts</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Market Structure Shift (MSS) */}
                <div
                  className={`p-3.5 rounded-xl border-2 transition-all ${
                    mssEnabled
                      ? 'border-purple-500/50 bg-purple-500/5'
                      : 'border-border bg-card/60 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-border/50">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-purple-500/10 text-purple-500 border border-purple-500/30 flex items-center justify-center font-bold text-xs">
                        MSS
                      </div>
                      <div>
                        <div className="text-xs font-bold text-foreground">Market Structure Shift</div>
                        <div className="text-[10px] text-muted-foreground">CHoCH / Swing Break</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={mssEnabled}
                      onChange={(e) => setMssEnabled(e.target.checked)}
                      className="h-4 w-4 rounded text-purple-600 cursor-pointer"
                    />
                  </div>

                  <div className="pt-2.5 space-y-2 text-xs">
                    <div className="text-[11px] text-muted-foreground">
                      Demands full candle body close above recent swing high with aggressive displacement.
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[10px] text-muted-foreground">
                      <span>C++ Confluence Weight:</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={5}
                          max={50}
                          value={mssWeight}
                          onChange={(e) => setMssWeight(Number.parseInt(e.target.value) || 0)}
                          className="w-12 text-[10px] font-mono font-bold text-right px-1 py-0.5 rounded border border-border bg-background"
                        />
                        <span>pts</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 5. Optimal Trade Entry (OTE - 0.705) */}
                <div
                  className={`p-3.5 rounded-xl border-2 transition-all ${
                    oteEnabled
                      ? 'border-amber-500/50 bg-amber-500/5'
                      : 'border-border bg-card/60 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-border/50">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/30 flex items-center justify-center font-bold text-xs">
                        OTE
                      </div>
                      <div>
                        <div className="text-xs font-bold text-foreground">Optimal Trade Entry</div>
                        <div className="text-[10px] text-muted-foreground">0.62 - 0.705 - 0.79 Fib</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={oteEnabled}
                      onChange={(e) => setOteEnabled(e.target.checked)}
                      className="h-4 w-4 rounded text-amber-600 cursor-pointer"
                    />
                  </div>

                  <div className="pt-2.5 space-y-2 text-xs">
                    <div className="text-[11px] text-muted-foreground">
                      Requires price to retrace into deep institutional discount zone (0.705 sweet spot).
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[10px] text-muted-foreground">
                      <span>C++ Confluence Weight:</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={5}
                          max={50}
                          value={oteWeight}
                          onChange={(e) => setOteWeight(Number.parseInt(e.target.value) || 0)}
                          className="w-12 text-[10px] font-mono font-bold text-right px-1 py-0.5 rounded border border-border bg-background"
                        />
                        <span>pts</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 6. Killzone Timing Engine */}
                <div
                  className={`p-3.5 rounded-xl border-2 transition-all ${
                    kzEnabled
                      ? 'border-rose-500/50 bg-rose-500/5'
                      : 'border-border bg-card/60 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-border/50">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-rose-500/10 text-rose-500 border border-rose-500/30 flex items-center justify-center font-bold text-xs">
                        KZ
                      </div>
                      <div>
                        <div className="text-xs font-bold text-foreground">Killzone Timing</div>
                        <div className="text-[10px] text-muted-foreground">High Liquidity Window</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={kzEnabled}
                      onChange={(e) => setKzEnabled(e.target.checked)}
                      className="h-4 w-4 rounded text-rose-600 cursor-pointer"
                    />
                  </div>

                  <div className="pt-2.5 space-y-2 text-xs">
                    <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-rose-500" />
                      <span>London Open (02:00-05:00) &amp; NY AM (08:30-11:00 EST)</span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[10px] text-muted-foreground">
                      <span>C++ Confluence Weight:</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={5}
                          max={50}
                          value={kzWeight}
                          onChange={(e) => setKzWeight(Number.parseInt(e.target.value) || 0)}
                          className="w-12 text-[10px] font-mono font-bold text-right px-1 py-0.5 rounded border border-border bg-background"
                        />
                        <span>pts</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Threshold Slider */}
              <div className="p-3.5 rounded-xl border border-border bg-muted/30 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <div className="font-semibold text-foreground">
                    Minimum C++ Confluence Execution Threshold: <span className="font-mono font-bold text-amber-500">{threshold}%</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    The C++ engine will only authorize order execution if the aggregated ICT score is at or above this percentage.
                  </div>
                </div>
                <div className="w-48">
                  <input
                    type="range"
                    min={50}
                    max={95}
                    step={5}
                    value={threshold}
                    onChange={(e) => setThreshold(Number.parseInt(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* C++ Confluence Manager & Compiler Tab */
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-amber-500" />
                  <span className="text-xs font-semibold text-foreground">
                    C++ Confluence Engine &amp; Compilation Sandbox
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Load Strategy Preset:</span>
                  <select
                    onChange={(e) => handleApplyPreset(e.target.value)}
                    className="text-xs rounded-lg border border-border bg-background px-2.5 py-1 text-foreground"
                  >
                    {PRESET_CPP_TEMPLATES.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Code Editor */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-muted-foreground">
                      Source: <code>ict_confluence_engine.cpp</code>
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      ISO C++20 • SIMD Vectorized
                    </span>
                  </div>
                  <textarea
                    rows={14}
                    value={cppCode}
                    onChange={(e) => setCppCode(e.target.value)}
                    className="w-full font-mono text-[11px] leading-relaxed rounded-xl border border-border bg-black/90 text-emerald-400 p-3.5 resize-none focus:ring-1 focus:ring-amber-500 focus:outline-none"
                    spellCheck={false}
                  />

                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleCompileCpp}
                      disabled={isCompiling}
                      className="gap-1.5 h-8 text-xs bg-amber-500 hover:bg-amber-600 text-black font-semibold cursor-pointer"
                    >
                      <Zap className="h-3.5 w-3.5 fill-black" />
                      {isCompiling ? 'Compiling C++20...' : 'Compile & Link C++ Logic'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRunEvaluation}
                      className="gap-1.5 h-8 text-xs cursor-pointer"
                    >
                      <Activity className="h-3.5 w-3.5 text-amber-500" />
                      Run Live Confluence Test
                    </Button>
                  </div>
                </div>

                {/* Compiler Diagnostics & Execution Output */}
                <div className="space-y-3">
                  {/* Compiler Terminal Output */}
                  <div className="rounded-xl border border-border bg-black p-3 space-y-2">
                    <div className="flex items-center justify-between pb-1.5 border-b border-border/40 text-xs">
                      <div className="flex items-center gap-1.5 text-muted-foreground font-mono">
                        <Terminal className="h-3.5 w-3.5 text-amber-500" />
                        <span>Compiler Diagnostics</span>
                      </div>
                      {compilerOutput?.success ? (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          BUILD SUCCESS (0 ERRORS)
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30">
                          BUILD FAILED
                        </span>
                      )}
                    </div>
                    <pre className="font-mono text-[10px] text-muted-foreground whitespace-pre-wrap max-h-36 overflow-y-auto">
                      {compilerOutput?.compilerLog || 'Click "Compile & Link C++ Logic" to build the C++ module.'}
                    </pre>
                    {compilerOutput?.success && (
                      <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground pt-1 border-t border-border/30">
                        <span>Speed: {compilerOutput.latencyBenchmarkUs} μs/eval</span>
                        <span>Binary: {compilerOutput.binarySizeKb} KB</span>
                        <span>Build time: {compilerOutput.compilationTimeMs}ms</span>
                      </div>
                    )}
                  </div>

                  {/* Simulated Confluence Evaluation Result */}
                  {evalResult && (
                    <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-bold text-foreground">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          <span>Simulation Output: {evalResult.direction} EUR/USD</span>
                        </div>
                        <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                          {evalResult.confluenceScore}% Confluence
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 font-mono text-[11px] pt-1">
                        <div className="bg-card/70 p-1.5 rounded border border-border">
                          <div className="text-[9px] text-muted-foreground">Entry Price</div>
                          <div className="font-semibold text-foreground">{evalResult.entryPrice}</div>
                        </div>
                        <div className="bg-card/70 p-1.5 rounded border border-border">
                          <div className="text-[9px] text-muted-foreground">Stop Loss (SL)</div>
                          <div className="font-semibold text-rose-500">{evalResult.stopLoss}</div>
                        </div>
                        <div className="bg-card/70 p-1.5 rounded border border-border">
                          <div className="text-[9px] text-muted-foreground">Take Profit (TP)</div>
                          <div className="font-semibold text-emerald-500">{evalResult.takeProfit}</div>
                        </div>
                      </div>

                      <div className="text-[10px] text-muted-foreground pt-1 flex flex-wrap gap-1">
                        <span className="font-semibold">Triggered by:</span>
                        {evalResult.triggeredConcepts.map((c) => (
                          <span key={c} className="px-1 py-0.2 rounded bg-muted font-mono text-foreground">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3 sm:px-6 border-t border-border bg-muted/20 flex items-center justify-between shrink-0">
          <div className="text-xs text-muted-foreground hidden sm:flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>
              C++ Confluence logic updates automatically compile and feed outputs to downstream MetaTrader 5 execution nodes.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSaveAndApply}
              className="gap-1.5 h-8 text-xs bg-amber-500 hover:bg-amber-600 text-black font-semibold cursor-pointer"
            >
              <span>Apply to Workflow Node</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
