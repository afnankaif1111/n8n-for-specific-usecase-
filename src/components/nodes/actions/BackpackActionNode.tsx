import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Briefcase } from 'lucide-react'

export interface BackpackActionData extends Record<string, unknown> {
  label: string
  actionKind?: 'backpack' | 'broker'
  pair?: string
  side?: string
  subtitle?: string
}

export function BackpackActionNode(props: NodeProps) {
  const data = props.data as unknown as BackpackActionData

  return (
    <div className="min-w-[220px] max-w-[260px] rounded-xl border-2 border-border bg-card p-3 shadow-md transition-all hover:border-indigo-500/50 text-left">
      <Handle
        type="target"
        position={Position.Left}
        id="target-left"
        className="!h-3 !w-3 !rounded-full !bg-indigo-500 !border-2 !border-background"
      />
      <Handle
        type="target"
        position={Position.Top}
        id="target-top"
        className="!h-2.5 !w-2.5 !rounded-full !bg-muted-foreground !border-2 !border-background opacity-60 hover:opacity-100"
      />

      <div className="flex items-center justify-between pb-2 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-indigo-500/30 bg-indigo-500/10 text-indigo-500">
            <Briefcase className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground">Action</div>
            <div className="text-xs font-bold leading-none text-foreground">Broker Router</div>
          </div>
        </div>
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded border border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
          ECN Route
        </span>
      </div>

      <div className="pt-2 space-y-1">
        <div className="text-xs font-medium text-foreground">
          {data.label || 'OANDA / IC Markets Spot Fill'}
        </div>
        {data.subtitle && (
          <div className="text-[10px] text-muted-foreground pt-0.5 line-clamp-1">
            {data.subtitle}
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        id="source-right"
        className="!h-3 !w-3 !rounded-full !bg-indigo-500 !border-2 !border-background"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="source-bottom"
        className="!h-2.5 !w-2.5 !rounded-full !bg-indigo-500 !border-2 !border-background opacity-60 hover:opacity-100"
      />
    </div>
  )
}

export const BrokerRouterActionNode = BackpackActionNode

