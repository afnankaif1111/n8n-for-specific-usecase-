import { Handle, Position, type NodeProps } from '@xyflow/react'
import { ArrowUpRight, ArrowDownRight, Zap } from 'lucide-react'

export interface LighterActionData extends Record<string, unknown> {
  label: string
  actionKind?: 'lighter' | 'mt5'
  actionType?: 'market' | 'limit' | 'stop' | 'cancel' | 'liquidity' | string
  pair?: string
  side?: 'buy' | 'sell' | string
  amount?: string
  lotSize?: string
  price?: string
  sl?: string
  tp?: string
  slippage?: string
  subtitle?: string
}

export function LighterActionNode(props: NodeProps) {
  const data = props.data as unknown as LighterActionData

  const actionType = data.actionType || 'market'
  const pair = data.pair || 'EUR/USD'
  const side = data.side || 'buy'
  const amount = data.amount || data.lotSize || '1.00 Lot'
  const price = data.price
  const isBuy = side.toLowerCase().includes('buy') || side.toLowerCase().includes('long')

  return (
    <div className="min-w-[220px] max-w-[260px] rounded-xl border-2 border-border bg-card p-3 shadow-md transition-all hover:border-emerald-500/50 text-left">
      {/* Target Handles - Left for horizontal flow, Top for vertical flow */}
      <Handle
        type="target"
        position={Position.Left}
        id="target-left"
        className="!h-3 !w-3 !rounded-full !bg-emerald-500 !border-2 !border-background"
      />
      <Handle
        type="target"
        position={Position.Top}
        id="target-top"
        className="!h-2.5 !w-2.5 !rounded-full !bg-muted-foreground !border-2 !border-background opacity-60 hover:opacity-100"
      />

      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-500">
            <Zap className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground">Action</div>
            <div className="text-xs font-bold leading-none text-foreground">MetaTrader 5</div>
          </div>
        </div>
        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          {pair}
        </span>
      </div>

      {/* Main Parameters Display */}
      <div className="pt-2 space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs font-semibold text-foreground">
            {isBuy ? (
              <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5 text-rose-500" />
            )}
            <span className={isBuy ? 'text-emerald-600 dark:text-emerald-400 uppercase font-bold' : 'text-rose-600 dark:text-rose-400 uppercase font-bold'}>
              {side}
            </span>
            <span className="text-foreground font-mono text-[11px] font-semibold">
              {amount}
            </span>
          </div>
          <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-muted font-mono font-medium text-muted-foreground">
            {actionType}
          </span>
        </div>

        {price && (
          <div className="text-[11px] font-mono text-muted-foreground">
            Price / Limit: <span className="font-semibold text-foreground">{price}</span>
          </div>
        )}

        {data.subtitle && (
          <div className="text-[10px] text-muted-foreground pt-0.5 line-clamp-1">
            {data.subtitle}
          </div>
        )}
      </div>

      {/* Source Handles - Right for horizontal flow, Bottom for vertical flow */}
      <Handle
        type="source"
        position={Position.Right}
        id="source-right"
        className="!h-3 !w-3 !rounded-full !bg-emerald-500 !border-2 !border-background"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="source-bottom"
        className="!h-2.5 !w-2.5 !rounded-full !bg-emerald-500 !border-2 !border-background opacity-60 hover:opacity-100"
      />
    </div>
  )
}

export const MT5ActionNode = LighterActionNode

