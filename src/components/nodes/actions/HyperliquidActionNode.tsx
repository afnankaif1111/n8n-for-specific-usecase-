import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Zap, ArrowUpRight, ArrowDownRight } from 'lucide-react'

export interface HyperliquidActionData extends Record<string, unknown> {
  label: string
  actionKind?: 'hyperliquid'
  pair?: string
  side?: 'buy' | 'sell' | string
  leverage?: string
  size?: string
  subtitle?: string
}

export function HyperliquidActionNode(props: NodeProps) {
  const data = props.data as unknown as HyperliquidActionData

  const pair = data.pair || 'ETH-PERP'
  const side = data.side || 'Long'
  const isLong = side.toLowerCase().includes('long') || side.toLowerCase().includes('buy')
  const leverage = data.leverage || '5x'

  return (
    <div className="min-w-[220px] max-w-[260px] rounded-xl border-2 border-border bg-card p-3 shadow-md transition-all hover:border-emerald-500/50 text-left">
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

      <div className="flex items-center justify-between pb-2 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-500">
            <Zap className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground">Action</div>
            <div className="text-xs font-bold leading-none text-foreground">Hyperliquid</div>
          </div>
        </div>
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
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
            <span className="font-mono text-muted-foreground text-[11px]">{pair}</span>
          </div>
        </div>

        <div className="text-xs font-medium text-foreground">
          {data.label || 'Hyperliquid Perp Execution'}
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
