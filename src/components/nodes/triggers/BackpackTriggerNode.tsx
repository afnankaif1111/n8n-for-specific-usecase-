import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Briefcase } from 'lucide-react'

export interface BackpackTriggerData extends Record<string, unknown> {
  label: string
  kind?: 'backpack'
  eventType?: string
  pair?: string
  subtitle?: string
}

export function BackpackTriggerNode(props: NodeProps) {
  const data = props.data as unknown as BackpackTriggerData

  return (
    <div className="min-w-[220px] rounded-xl border-2 border-border bg-card p-3 shadow-md transition-all hover:border-rose-500/50">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-500">
            <Briefcase className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground">Trigger</div>
            <div className="text-xs font-bold leading-none text-foreground">Backpack</div>
          </div>
        </div>
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400">
          Backpack
        </span>
      </div>

      {/* Body */}
      <div className="pt-2 text-xs font-medium text-foreground">
        {data.label || 'Backpack Spot Event'}
      </div>
      {data.subtitle && (
        <div className="text-[11px] text-muted-foreground mt-0.5">
          {data.subtitle}
        </div>
      )}

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!h-3 !w-3 !rounded-full !bg-rose-500 !border-2 !border-background"
      />
    </div>
  )
}
