import { Handle, Position, type NodeProps } from '@xyflow/react'
import { ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react'

export interface HyperliquidActionData extends Record<string, unknown> {
  label: string
  actionKind?: 'hyperliquid' | 'ctrader'
  pair?: string
  side?: 'buy' | 'sell' | string
  leverage?: string
  size?: string
  subtitle?: string
}

export function HyperliquidActionNode(props: NodeProps) {
  const data = props.data as unknown as HyperliquidActionData

  const pair = data.pair || 'GBP/USD'
  const side = data.side || 'Buy'
  const isLong = side.toLowerCase().includes('long') || side.toLowerCase().includes('buy')
  const leverage = data.leverage || '1:100'

  return (
    <div className="min-w-[220px] max-w-[260px] rounded-xl border-2 border-border bg-card p-3 shadow-md transition-all hover:border-teal-500/50 text-left">
      <Handle
        type="target"
        position={Position.Left}
        id="target-left"
        className="!h-3 !w-3 !rounded-full !bg-teal-500 !border-2 !border-background"
      />
      <Handle
        type="target"
        position={Position.Top}
        id="target-top"
        className="!h-2.5 !w-2.5 !rounded-full !bg-muted-foreground !border-2 !border-background opacity-60 hover:opacity-100"
      />

      <div className="flex items-center justify-between pb-2 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-teal-500/30 bg-teal-500/10 text-teal-500">
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground">Action</div>
            <div className="text-xs font-bold leading-none text-foreground">cTrader / FIX</div>
          </div>
        </div>
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded border border-teal-500/30 bg-teal-500/10 text-teal-600 dark:text-teal-400 font-mono">
          {leverage}
        </span>
      </div>

      <div className="pt-2 space-y-1.5">
        <div className="flex items-center justify-between text-xs font-semibold text-foreground">
          <div className="flex items-center gap-1">
            {isLong ? (
              <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5 text-rose-500" />
            )}
            <span className={isLong ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-rose-600 dark:text-rose-400 font-bold'}>
              {side}
            </span>
            <span className="font-mono text-foreground font-semibold text-[11px]">{pair}</span>
          </div>
        </div>

        <div className="text-xs font-medium text-foreground">
          {data.label || 'cTrader: ECN Market Fill'}
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
        className="!h-3 !w-3 !rounded-full !bg-teal-500 !border-2 !border-background"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="source-bottom"
        className="!h-2.5 !w-2.5 !rounded-full !bg-teal-500 !border-2 !border-background opacity-60 hover:opacity-100"
      />
    </div>
  )
}

export const CTraderActionNode = HyperliquidActionNode

