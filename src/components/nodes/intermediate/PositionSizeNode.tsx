import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Calculator } from 'lucide-react'
import { useNodeField } from './useNodeField'

export interface PositionSizeNodeData extends Record<string, unknown> {
  label: string
  intermediateKind?: 'position-size'
  accountBalance?: number
  riskPercent?: number
  pipValuePerLot?: number
  maxLots?: number
  subtitle?: string
}

const cell = 'w-full text-[11px] rounded border border-border bg-background px-1 py-0.5 text-foreground font-mono'

export function PositionSizeNode(props: NodeProps) {
  const data = props.data as unknown as PositionSizeNodeData
  const [balance, setBalance] = useNodeField<number>(props.id, 'accountBalance', data.accountBalance ?? 10000)
  const [risk, setRisk] = useNodeField<number>(props.id, 'riskPercent', data.riskPercent ?? 1)
  const [pipValue, setPipValue] = useNodeField<number>(props.id, 'pipValuePerLot', data.pipValuePerLot ?? 10)
  const [maxLots, setMaxLots] = useNodeField<number>(props.id, 'maxLots', data.maxLots ?? 5)

  const num = (set: (n: number) => void) => (e: React.ChangeEvent<HTMLInputElement>) => set(Number(e.target.value))

  return (
    <div className="min-w-[240px] max-w-[280px] rounded-xl border-2 border-violet-500/40 bg-card p-3 shadow-md hover:border-violet-500/80 transition-all text-left">
      <Handle type="target" position={Position.Left} id="target-left" className="!h-3 !w-3 !rounded-full !bg-violet-500 !border-2 !border-background" />

      <div className="flex items-center justify-between pb-2 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-violet-500/30 bg-violet-500/10 text-violet-500">
            <Calculator className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[10px] font-semibold tracking-wider uppercase text-violet-600 dark:text-violet-400">Risk Management</div>
            <div className="text-xs font-bold leading-none text-foreground">Position Size</div>
          </div>
        </div>
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded border border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400">
          {risk}% risk
        </span>
      </div>

      <div className="pt-2 space-y-2">
        <div className="text-xs font-semibold text-foreground">{data.label || 'Position Size (Fixed % Risk)'}</div>
        <div className="nodrag nopan grid grid-cols-2 gap-1.5 text-[10px] text-muted-foreground">
          <label className="space-y-0.5">Balance<input type="number" className={cell} value={balance} onChange={num(setBalance)} /></label>
          <label className="space-y-0.5">Risk %<input type="number" step="0.1" className={cell} value={risk} onChange={num(setRisk)} /></label>
          <label className="space-y-0.5">Pip value / lot<input type="number" className={cell} value={pipValue} onChange={num(setPipValue)} /></label>
          <label className="space-y-0.5">Max lots<input type="number" step="0.1" className={cell} value={maxLots} onChange={num(setMaxLots)} /></label>
        </div>
        <div className="text-[10px] text-muted-foreground">
          lots = balance × risk% ÷ (stop pips × pip value). Needs <code>entry</code> and <code>stopLoss</code> from upstream (ICT or TradingView <code>sl</code>); otherwise the branch stops.
        </div>
      </div>

      <Handle type="source" position={Position.Right} id="source-right" className="!h-3 !w-3 !rounded-full !bg-violet-500 !border-2 !border-background" />
    </div>
  )
}
