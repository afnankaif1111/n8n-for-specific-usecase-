import { Handle, Position, type NodeProps } from '@xyflow/react'
import { GitBranch, ShieldCheck } from 'lucide-react'

export interface ConditionNodeData extends Record<string, unknown> {
  label: string
  intermediateKind?: 'condition'
  conditionRule?: string
  subtitle?: string
}

export function ConditionNode(props: NodeProps) {
  const data = props.data as unknown as ConditionNodeData

  return (
    <div className="min-w-[220px] max-w-[260px] rounded-xl border-2 border-cyan-500/40 bg-card p-3 shadow-md hover:border-cyan-500/80 transition-all text-left">
      {/* Target Handle strictly on the LEFT side */}
      <Handle
        type="target"
        position={Position.Left}
        id="target-left"
        className="!h-3 !w-3 !rounded-full !bg-cyan-500 !border-2 !border-background hover:scale-125 transition-transform"
      />

      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-500">
            <GitBranch className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[10px] font-semibold tracking-wider uppercase text-cyan-600 dark:text-cyan-400">
              Intermediate Logic
            </div>
            <div className="text-xs font-bold leading-none text-foreground">
              Condition & Risk
            </div>
          </div>
        </div>
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded border border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
          Filter
        </span>
      </div>

      <div className="pt-2 space-y-1.5">
        <div className="text-xs font-semibold text-foreground">
          {data.label || 'Risk Check (Spread < 1.2 Pips)'}
        </div>

        {data.subtitle && (
          <div className="text-[10px] text-muted-foreground pt-0.5 line-clamp-1">
            {data.subtitle}
          </div>
        )}

        <div className="flex items-center gap-1 text-[10px] font-medium text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 w-fit">
          <ShieldCheck className="h-3 w-3" />
          <span>Pass: True ➔ Proceed</span>
        </div>
      </div>

      {/* Source Handle strictly on the RIGHT side */}
      <Handle
        type="source"
        position={Position.Right}
        id="source-right"
        className="!h-3 !w-3 !rounded-full !bg-cyan-500 !border-2 !border-background hover:scale-125 transition-transform"
      />
    </div>
  )
}
