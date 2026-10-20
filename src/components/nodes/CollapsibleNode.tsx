import type { ComponentType } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import {
  Webhook, TrendingUp, Clock, Zap, Briefcase, Flame, Sparkles, Bot, Brain,
  GitBranch, Calculator, Send, Bell, Box, type LucideIcon,
} from 'lucide-react'

interface Look {
  icon: LucideIcon
  tag: string
  /** Tailwind colour name used for the border, icon chip and handles */
  tone: 'sky' | 'amber' | 'blue' | 'emerald' | 'rose' | 'orange' | 'indigo' | 'cyan' | 'violet' | 'purple' | 'slate'
}

const LOOKS: Record<string, Look> = {
  // triggers
  tradingview: { icon: Webhook, tag: 'Trigger', tone: 'sky' },
  price: { icon: TrendingUp, tag: 'Trigger', tone: 'amber' },
  timer: { icon: Clock, tag: 'Trigger', tone: 'blue' },
  mt5: { icon: Zap, tag: 'Trigger', tone: 'emerald' },
  hyperliquid: { icon: Zap, tag: 'Trigger', tone: 'emerald' },
  news: { icon: Briefcase, tag: 'Trigger', tone: 'rose' },
  backpack: { icon: Briefcase, tag: 'Trigger', tone: 'rose' },
  broker: { icon: Flame, tag: 'Trigger', tone: 'orange' },
  lighter: { icon: Flame, tag: 'Trigger', tone: 'orange' },
  // intermediates
  'smart-ict': { icon: Flame, tag: 'ICT', tone: 'amber' },
  ict: { icon: Flame, tag: 'ICT', tone: 'amber' },
  gemini: { icon: Sparkles, tag: 'AI', tone: 'indigo' },
  chatgpt: { icon: Bot, tag: 'AI', tone: 'emerald' },
  claude: { icon: Brain, tag: 'AI', tone: 'amber' },
  condition: { icon: GitBranch, tag: 'Filter', tone: 'cyan' },
  'position-size': { icon: Calculator, tag: 'Risk', tone: 'violet' },
  // actions
  trade: { icon: Send, tag: 'Action', tone: 'purple' },
  notification: { icon: Bell, tag: 'Action', tone: 'purple' },
  ctrader: { icon: Send, tag: 'Action', tone: 'purple' },
}

// Full class names so Tailwind can see them.
const TONES: Record<Look['tone'], { border: string; chip: string; handle: string }> = {
  sky: { border: 'hover:border-sky-500/70', chip: 'border-sky-500/30 bg-sky-500/10 text-sky-500', handle: '!bg-sky-500' },
  amber: { border: 'hover:border-amber-500/70', chip: 'border-amber-500/30 bg-amber-500/10 text-amber-500', handle: '!bg-amber-500' },
  blue: { border: 'hover:border-blue-500/70', chip: 'border-blue-500/30 bg-blue-500/10 text-blue-500', handle: '!bg-blue-500' },
  emerald: { border: 'hover:border-emerald-500/70', chip: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500', handle: '!bg-emerald-500' },
  rose: { border: 'hover:border-rose-500/70', chip: 'border-rose-500/30 bg-rose-500/10 text-rose-500', handle: '!bg-rose-500' },
  orange: { border: 'hover:border-orange-500/70', chip: 'border-orange-500/30 bg-orange-500/10 text-orange-500', handle: '!bg-orange-500' },
  indigo: { border: 'hover:border-indigo-500/70', chip: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-500', handle: '!bg-indigo-500' },
  cyan: { border: 'hover:border-cyan-500/70', chip: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-500', handle: '!bg-cyan-500' },
  violet: { border: 'hover:border-violet-500/70', chip: 'border-violet-500/30 bg-violet-500/10 text-violet-500', handle: '!bg-violet-500' },
  purple: { border: 'hover:border-purple-500/70', chip: 'border-purple-500/30 bg-purple-500/10 text-purple-500', handle: '!bg-purple-500' },
  slate: { border: 'hover:border-slate-500/70', chip: 'border-slate-500/30 bg-slate-500/10 text-slate-500', handle: '!bg-slate-500' },
}

function lookFor(props: NodeProps): Look {
  const d = (props.data ?? {}) as Record<string, unknown>
  const type = String(props.type ?? '')
  const group = String(d.nodeType ?? '')
  // Kinds like "lighter" exist as both trigger and action, so the node's group decides first.
  if (group === 'action' || type.includes('action')) {
    const kind = String(d.actionKind ?? d.kind ?? '').toLowerCase()
    return { icon: kind === 'notification' ? Bell : Send, tag: 'Action', tone: 'purple' }
  }
  const key = String(d.intermediateKind ?? d.kind ?? '').toLowerCase()
  if (LOOKS[key]) return LOOKS[key]
  if (type.includes('trigger')) return { icon: Box, tag: 'Trigger', tone: 'slate' }
  if (type.includes('action')) return { icon: Send, tag: 'Action', tone: 'purple' }
  return { icon: Box, tag: 'Node', tone: 'slate' }
}

/** Title-only card shown while a node is not selected. */
function CompactNode(props: NodeProps) {
  const data = (props.data ?? {}) as { label?: string }
  const look = lookFor(props)
  const tone = TONES[look.tone]
  const Icon = look.icon
  const isTrigger = String(props.type ?? '').includes('trigger') || look.tag === 'Trigger'
  const handle = `!h-3 !w-3 !rounded-full ${tone.handle} !border-2 !border-background`

  return (
    <div
      title="Click to expand"
      className={`flex w-[230px] cursor-pointer items-center gap-2 rounded-xl border-2 border-border bg-card px-3 py-2.5 text-left shadow-md transition-all ${tone.border}`}
    >
      {!isTrigger && <Handle type="target" position={Position.Left} id="target-left" className={handle} />}
      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${tone.chip}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <div className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">{look.tag}</div>
        <div className="truncate text-xs font-bold leading-tight text-foreground">{data.label || 'Untitled node'}</div>
      </div>
      <Handle type="source" position={Position.Right} id="source-right" className={handle} />
    </div>
  )
}

/**
 * Renders the node as a compact title card until it is selected (clicked);
 * the full card with its settings only shows while selected.
 */
export function withCollapse(Full: ComponentType<NodeProps>): ComponentType<NodeProps> {
  function Collapsible(props: NodeProps) {
    return props.selected ? <Full {...props} /> : <CompactNode {...props} />
  }
  Collapsible.displayName = `Collapsible(${Full.displayName || Full.name || 'Node'})`
  return Collapsible
}

export function collapseAll(types: Record<string, ComponentType<NodeProps>>): Record<string, ComponentType<NodeProps>> {
  const cache = new Map<ComponentType<NodeProps>, ComponentType<NodeProps>>()
  return Object.fromEntries(
    Object.entries(types).map(([key, Comp]) => {
      if (!cache.has(Comp)) cache.set(Comp, withCollapse(Comp))
      return [key, cache.get(Comp)!]
    }),
  )
}
