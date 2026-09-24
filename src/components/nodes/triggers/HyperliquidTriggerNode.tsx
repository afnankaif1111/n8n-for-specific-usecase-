import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Activity } from 'lucide-react'

export interface HyperliquidTriggerData extends Record<string, unknown> {
  label: string
  kind?: 'hyperliquid' | 'mt5'
  eventType?: string
  asset?: string
  subtitle?: string
}

export function HyperliquidTriggerNode(props: NodeProps) {
  const data = props.data as unknown as HyperliquidTriggerData

  return (
    <div className="min-w-[220px] rounded-xl border-2 border-border bg-card p-3 shadow-md transition-all hover:border-emerald-500/50 text-left">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-500">
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground">Trigger</div>
            <div className="text-xs font-bold leading-none text-foreground">MetaTrader 5</div>
          </div>
        </div>
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          MT4 / MT5
        </span>
      </div>

      {/* Body */}
      <div className="pt-2 text-xs font-medium text-foreground">
        {data.label || 'MT5 Margin & Equity Alert'}
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
        className="!h-3 !w-3 !rounded-full !bg-emerald-500 !border-2 !border-background"
      />
    </div>
  )
}

export const MT5TriggerNode = HyperliquidTriggerNode

