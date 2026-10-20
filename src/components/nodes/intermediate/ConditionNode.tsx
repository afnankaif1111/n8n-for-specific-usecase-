import { Handle, Position, type NodeProps } from '@xyflow/react'
import { GitBranch, ShieldCheck, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useNodeField } from './useNodeField'

export interface ConditionRule {
  field: string
  op: '>' | '>=' | '<' | '<=' | '==' | '!=' | 'contains' | 'exists'
  value: string
}

export interface ConditionNodeData extends Record<string, unknown> {
  label: string
  intermediateKind?: 'condition'
  conditionRule?: string
  rules?: ConditionRule[]
  combinator?: 'all' | 'any'
  subtitle?: string
}

const OPS: ConditionRule['op'][] = ['>', '>=', '<', '<=', '==', '!=', 'contains', 'exists']
const cell = 'w-full text-[11px] rounded border border-border bg-background px-1 py-0.5 text-foreground font-mono'

/** Fields produced by upstream nodes that are handy to test against. */
const FIELD_HINTS = ['confluenceScore', 'direction', 'riskReward', 'entry', 'stopLoss', 'takeProfit', 'price', 'confidence', 'aiDecision']

export function ConditionNode(props: NodeProps) {
  const data = props.data as unknown as ConditionNodeData
  const [rules, setRules] = useNodeField<ConditionRule[]>(props.id, 'rules', data.rules ?? [])
  const [combinator, setCombinator] = useNodeField<'all' | 'any'>(props.id, 'combinator', data.combinator ?? 'all')
  const [open, setOpen] = useState(false)

  const update = (i: number, patch: Partial<ConditionRule>) =>
    setRules(rules.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))

  return (
    <div
      className={`min-w-[220px] ${open ? 'max-w-[320px]' : 'max-w-[260px]'} rounded-xl border-2 border-cyan-500/40 bg-card p-3 shadow-md hover:border-cyan-500/80 transition-all text-left`}
    >
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

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-[10px] font-medium text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 w-fit">
            <ShieldCheck className="h-3 w-3" />
            <span>
              {rules.length
                ? `${combinator === 'all' ? 'All' : 'Any'} of ${rules.length} rule${rules.length === 1 ? '' : 's'} ➔ Proceed`
                : 'No rules ➔ passes through'}
            </span>
          </div>
          <button type="button" onClick={() => setOpen(!open)} className="text-[10px] text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer">
            {open ? 'Close' : 'Edit rules'}
          </button>
        </div>

        {open && (
          <div className="nodrag nopan nowheel space-y-1.5 rounded-lg border border-border bg-muted/40 p-2">
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              Pass when
              <select className={cell} value={combinator} onChange={(e) => setCombinator(e.target.value as 'all' | 'any')}>
                <option value="all">ALL rules match</option>
                <option value="any">ANY rule matches</option>
              </select>
            </div>

            {rules.map((r, i) => (
              <div key={i} className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-1">
                <input list={`fields-${props.id}`} className={cell} value={r.field} onChange={(e) => update(i, { field: e.target.value })} placeholder="field" />
                <select className={cell} value={r.op} onChange={(e) => update(i, { op: e.target.value as ConditionRule['op'] })}>
                  {OPS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
                <input className={cell} value={r.value} disabled={r.op === 'exists'} onChange={(e) => update(i, { value: e.target.value })} placeholder="value" />
                <button type="button" onClick={() => setRules(rules.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-rose-500 cursor-pointer">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
            <datalist id={`fields-${props.id}`}>
              {FIELD_HINTS.map((f) => (
                <option key={f} value={f} />
              ))}
            </datalist>

            <button type="button" onClick={() => setRules([...rules, { field: 'confluenceScore', op: '>=', value: '75' }])} className="flex items-center gap-1 text-[10px] text-foreground hover:underline cursor-pointer">
              <Plus className="h-3 w-3" /> Add rule
            </button>
            <p className="text-[10px] text-muted-foreground">
              Fields come from upstream node outputs (dot paths allowed, e.g. <code>ict.scores.buy</code>). A missing field fails the rule.
            </p>
          </div>
        )}
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
