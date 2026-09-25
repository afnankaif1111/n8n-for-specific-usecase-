import { useState } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import {
  Flame,
  Cpu,
  CheckCircle2,
  SlidersHorizontal,
  Zap,
} from 'lucide-react'
import { ICTStudioModal } from '@/components/ict/ICTStudioModal'
import type { ICTStudioState, ConfluenceEvaluationResult } from '@/components/ict/types'
import { evaluateConfluenceWithCpp, DEFAULT_CPP_CONFLUENCE_CODE } from '@/components/ict/cppCompiler'

export interface SmartICTNodeData extends Record<string, unknown> {
  label: string
  intermediateKind?: 'smart-ict' | 'ict'
  confluenceScore?: number
  minThreshold?: number
  bias?: 'BUY' | 'SELL' | 'NEUTRAL'
  subtitle?: string
  studioState?: ICTStudioState
}

export function SmartICTNode(props: NodeProps) {
  const data = props.data as unknown as SmartICTNodeData

  const [isModalOpen, setIsModalOpen] = useState(false)

  // Default internal studio state
  const [studioState, setStudioState] = useState<ICTStudioState>(() => {
    return (
      data.studioState || {
        fvg: {
          enabled: true,
          direction: 'bullish_bisi',
          timeframe: '15m',
          minSizePips: 2.5,
          unmitigatedOnly: true,
          weight: 25,
        },
        orderBlock: {
          enabled: true,
          direction: 'bullish',
          lookbackCandles: 20,
          volumeMultiplier: 1.8,
          requireBodyEngulf: true,
          weight: 25,
        },
        liquiditySweep: {
          enabled: true,
          poolType: 'ssl',
          sweepAsianRange: true,
          sweepPreviousDayHighLow: true,
          weight: 20,
        },
        mss: {
          enabled: true,
          requireBodyClose: true,
          confirmDisplacement: true,
          multiTimeframeAlign: true,
          weight: 15,
        },
        ote: {
          enabled: true,
          fibZone: '0.705_sweet_spot',
          targetDiscountZone: true,
          weight: 10,
        },
        killzone: {
          enabled: true,
          activeSession: 'ny_am',
          strictTimeFilter: true,
          weight: 5,
        },
        cppSource: DEFAULT_CPP_CONFLUENCE_CODE,
        minConfluenceThreshold: 75,
      }
    )
  })

  const [evaluation, setEvaluation] = useState<ConfluenceEvaluationResult>(() =>
    evaluateConfluenceWithCpp(studioState)
  )

  const handleSaveStudio = (newState: ICTStudioState, newEval: ConfluenceEvaluationResult) => {
    setStudioState(newState)
    setEvaluation(newEval)
  }

  // Active concepts summary
  const activeConcepts: string[] = []
  if (studioState.fvg.enabled) activeConcepts.push('FVG')
  if (studioState.orderBlock.enabled) activeConcepts.push('OB')
  if (studioState.liquiditySweep.enabled) activeConcepts.push('BSL/SSL')
  if (studioState.mss.enabled) activeConcepts.push('MSS')
  if (studioState.ote.enabled) activeConcepts.push('OTE')
  if (studioState.killzone.enabled) activeConcepts.push('Killzone')

  return (
    <>
      <div className="min-w-[260px] max-w-[300px] rounded-xl border-2 border-amber-500/50 bg-card p-3.5 shadow-lg hover:border-amber-500/90 transition-all text-left">
        {/* Target Handle strictly on the LEFT side */}
        <Handle
          type="target"
          position={Position.Left}
          id="target-left"
          className="!h-3 !w-3 !rounded-full !bg-amber-500 !border-2 !border-background hover:scale-125 transition-transform"
        />

        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-border/60">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-500">
              <Flame className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[10px] font-semibold tracking-wider uppercase text-amber-600 dark:text-amber-400">
                Institutional ICT
              </div>
              <div className="text-xs font-bold leading-none text-foreground">
                Smart ICT Engine
              </div>
            </div>
          </div>
          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <Cpu className="h-2.5 w-2.5" />
            C++20 SIMD
          </span>
        </div>

        {/* Main Content */}
        <div className="pt-2.5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-foreground">
              {data.label || 'ICT Confluence Evaluator'}
            </div>
            <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
              {evaluation.confluenceScore}% Match
            </span>
          </div>

          {/* Active Concept Pills */}
          <div className="flex flex-wrap gap-1 pt-0.5">
            {activeConcepts.map((c) => (
              <span
                key={c}
                className="text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded bg-muted/80 text-foreground border border-border/60"
              >
                {c}
              </span>
            ))}
          </div>

          {/* C++ Execution Status */}
          <div className="p-2 rounded-lg bg-amber-500/5 border border-amber-500/20 space-y-1 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                <span>C++ Logic Output:</span>
              </span>
              <span className="font-mono font-bold text-[10px] text-emerald-600 dark:text-emerald-400">
                {evaluation.shouldExecute ? `BUY (${evaluation.riskRewardRatio} RR)` : 'HOLD'}
              </span>
            </div>

            <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
              <span>Threshold: {studioState.minConfluenceThreshold}%</span>
              <span>Speed: {evaluation.executionLatencyUs} μs</span>
            </div>
          </div>

          {/* Open Sub-Canvas Studio Button */}
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-semibold text-xs transition-all cursor-pointer shadow-xs"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Open ICT Studio &amp; C++ Manager</span>
          </button>

          <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-0.5">
            <span className="flex items-center gap-1">
              <Zap className="h-3 w-3 text-amber-500" />
              Compiled &amp; Linked
            </span>
            <span className="text-emerald-600 dark:text-emerald-400">
              Input: Left ➔ Output: Right
            </span>
          </div>
        </div>

        {/* Source Handle strictly on the RIGHT side */}
        <Handle
          type="source"
          position={Position.Right}
          id="source-right"
          className="!h-3 !w-3 !rounded-full !bg-amber-500 !border-2 !border-background hover:scale-125 transition-transform"
        />
      </div>

      {/* Sub-Canvas Studio Popup Modal */}
      <ICTStudioModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        initialState={studioState}
        onSave={handleSaveStudio}
      />
    </>
  )
}
