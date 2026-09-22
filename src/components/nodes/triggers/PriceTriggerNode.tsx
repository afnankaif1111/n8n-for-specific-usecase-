import { Handle, Position, type NodeProps } from '@xyflow/react'
import { TrendingUp, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react'

export interface PriceTriggerData extends Record<string, unknown> {
  label: string
  kind?: 'price'
  asset?: string
  pair?: string
  condition?: 'above' | 'below' | string
  price?: string
  targetPrice?: string
  timer?: string
  subtitle?: string
}

export function PriceTriggerNode(props: NodeProps) {
  const data = props.data as unknown as PriceTriggerData

  const asset = data.asset || data.pair || 'BTC/USDT'
  const price = data.price || data.targetPrice || '95,000'
  const condition = data.condition || 'above'
  const timer = data.timer

  return (
    <div className="min-w-[220px] max-w-[260px] rounded-xl border-2 border-border bg-card p-3 shadow-md transition-all hover:border-amber-500/50 text-left">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-500">
            <TrendingUp className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground">Trigger</div>
            <div className="text-xs font-bold leading-none text-foreground">Price Trigger</div>
          </div>
        </div>
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400">
          {asset}
        </span>
      </div>

      {/* Main Parameters Display */}
      <div className="pt-2 space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs font-semibold text-foreground">
            {condition === 'above' ? (
              <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5 text-rose-500" />
            )}
            <span>{condition === 'above' ? 'Price >' : 'Price <'}</span>
            <span className="text-amber-600 dark:text-amber-400 font-mono font-bold">
              ${price}
            </span>
          </div>
        </div>

        {/* Timer / Check interval */}
        {timer && (
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded border border-border/50 w-fit">
            <Clock className="h-3 w-3 text-primary" />
            <span>Poll: {timer}</span>
          </div>
        )}

        {data.subtitle && (
          <div className="text-[10px] text-muted-foreground pt-0.5 line-clamp-1">
            {data.subtitle}
          </div>
        )}
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!h-3 !w-3 !rounded-full !bg-amber-500 !border-2 !border-background"
      />
    </div>
  )
}
