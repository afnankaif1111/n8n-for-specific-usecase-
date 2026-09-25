import { useCallback, useMemo, useState } from 'react'
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  Handle,
  Position,
  type Connection,
  type Edge as ReactFlowEdge,
  type Node,
  type NodeProps,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Button } from '@/components/ui/button'
import { TriggerSheet } from '@/components/triggersheet'
import { ActionSheet, type ActionKind } from '@/components/actionsheet'
import { IntermediateSheet, type IntermediateConfig } from '@/components/intermediatesheet'
import { triggerNodeTypes } from '@/components/nodes/triggers'
import { actionNodeTypes } from '@/components/nodes/actions'
import {
  intermediateNodeTypes,
  ConditionNode,
  type IntermediateKind,
} from '@/components/nodes/intermediate'
import {
  TrendingUp,
  Clock,
  Zap,
  Briefcase,
  Flame,
  Play,
  GitBranch,
  Bell,
  RotateCcw,
  CheckCircle2,
  Save,
  Database,
  Layers,
  Code2,
  Sparkles,
  Bot,
  Brain,
} from 'lucide-react'

// ==========================================
// Custom Interfaces and Types
// ==========================================

/**
 * Custom interface for workflow edges as requested
 */
export interface Edge {
  id: string
  source: string
  dest: string
}

export type TriggerKind = 'price' | 'timer' | 'hyperliquid' | 'backpack' | 'lighter'
export type { ActionKind, IntermediateKind }

export type NodeType = 'trigger' | 'action' | 'condition' | 'notification' | 'intermediate'

export interface TriggerNodeData extends Record<string, unknown> {
  label: string
  nodeType: 'trigger'
  kind: TriggerKind
  subtitle?: string
  config?: Record<string, unknown>
  asset?: string
  price?: string
  condition?: 'above' | 'below' | string
  timer?: string
}

export interface StandardNodeData extends Record<string, unknown> {
  label: string
  nodeType: 'action' | 'condition' | 'notification' | 'intermediate'
  actionKind?: ActionKind
  intermediateKind?: IntermediateKind
  subtitle?: string
  config?: Record<string, unknown>
  pair?: string
  side?: string
  amount?: string
  price?: string
  actionType?: string
  slippage?: string
  model?: string
  credentialTitle?: string
  credentialKey?: string
  promptTask?: string
  temperature?: number | string
  maxTokens?: number | string
}

export type WorkflowNodeData = TriggerNodeData | StandardNodeData

export interface NodeTypeItem {
  id: string
  type: NodeType
  title: string
  category: string
  description: string
  kind?: TriggerKind
  actionKind?: ActionKind
  intermediateKind?: IntermediateKind
  icon: typeof Zap
  colorClass: string
  badgeClass: string
}

// ==========================================
// Types of Nodes List Catalog
// ==========================================

export const NODE_TYPES_LIST: NodeTypeItem[] = [
  // Trigger kinds
  {
    id: 'trigger-price',
    type: 'trigger',
    kind: 'price',
    title: 'Forex Rate Trigger',
    category: 'Trigger',
    description: 'Fires when currency pair exchange rate crosses target threshold',
    icon: TrendingUp,
    colorClass: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
  },
  {
    id: 'trigger-timer',
    type: 'trigger',
    kind: 'timer',
    title: 'FX Session & Timer',
    category: 'Trigger',
    description: 'Schedules according to London/NY/Tokyo sessions or cron delays',
    icon: Clock,
    colorClass: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
  },
  {
    id: 'trigger-hyperliquid',
    type: 'trigger',
    kind: 'hyperliquid',
    title: 'MetaTrader 5 Trigger',
    category: 'Trigger',
    description: 'Monitors MT4/MT5 terminal margin, equity drawdown, or fill alerts',
    icon: Zap,
    colorClass: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  },
  {
    id: 'trigger-backpack',
    type: 'trigger',
    kind: 'backpack',
    title: 'Economic Calendar',
    category: 'Trigger',
    description: 'Monitors US NFP, FOMC rate decisions, and CPI inflation releases',
    icon: Briefcase,
    colorClass: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
    badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
  },
  {
    id: 'trigger-lighter',
    type: 'trigger',
    kind: 'lighter',
    title: 'Broker Spread & Liquidity',
    category: 'Trigger',
    description: 'Watches ECN broker bid/ask spreads, rollover swaps, and depth',
    icon: Flame,
    colorClass: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
    badgeClass: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30',
  },

  // Intermediate AI & Logic nodes
  {
    id: 'intermediate-smart-ict',
    type: 'intermediate',
    intermediateKind: 'smart-ict',
    title: 'Smart ICT Engine',
    category: 'AI / Intermediate',
    description: 'Sub-canvas studio for FVG, Order Blocks, Liquidity Sweeps, MSS & OTE linked to compiled C++ logic',
    icon: Flame,
    colorClass: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
  },
  {
    id: 'intermediate-gemini',
    type: 'intermediate',
    intermediateKind: 'gemini',
    title: 'Google Gemini AI',
    category: 'AI / Intermediate',
    description: 'High-speed multimodal reasoning on FX sentiment, macro releases & setup validation',
    icon: Sparkles,
    colorClass: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
    badgeClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
  },
  {
    id: 'intermediate-chatgpt',
    type: 'intermediate',
    intermediateKind: 'chatgpt',
    title: 'OpenAI ChatGPT',
    category: 'AI / Intermediate',
    description: 'GPT-4o trade setup validation, lot sizing, and slippage guard rules',
    icon: Bot,
    colorClass: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  },
  {
    id: 'intermediate-claude',
    type: 'intermediate',
    intermediateKind: 'claude',
    title: 'Anthropic Claude',
    category: 'AI / Intermediate',
    description: 'Multi-timeframe price action analysis, support/resistance & risk/reward filter',
    icon: Brain,
    colorClass: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
  },
  {
    id: 'condition-filter',
    type: 'condition',
    title: 'Risk & Margin Check',
    category: 'Logic',
    description: 'Branching logic evaluating free margin, spread, and ADR volatility',
    icon: GitBranch,
    colorClass: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
    badgeClass: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
  },

  // Action nodes
  {
    id: 'action-lighter',
    type: 'action',
    actionKind: 'lighter',
    title: 'MetaTrader 5 Action',
    category: 'Action',
    description: 'Dispatches market, limit, or stop orders to MT4/MT5 terminals',
    icon: Zap,
    colorClass: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  },
  {
    id: 'action-hyperliquid',
    type: 'action',
    actionKind: 'hyperliquid',
    title: 'cTrader / FIX API Action',
    category: 'Action',
    description: 'Executes ultra low-latency institutional ECN orders via FIX 4.4',
    icon: Zap,
    colorClass: 'text-teal-500 bg-teal-500/10 border-teal-500/20',
    badgeClass: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30',
  },
  {
    id: 'action-backpack',
    type: 'action',
    actionKind: 'backpack',
    title: 'Forex Broker Router',
    category: 'Action',
    description: 'Routes spot forex trades to lowest spread broker (OANDA, IC Markets)',
    icon: Briefcase,
    colorClass: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
    badgeClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
  },
  {
    id: 'action-trade',
    type: 'action',
    actionKind: 'trade',
    title: 'FX Risk & Position Manager',
    category: 'Action',
    description: 'Automated trailing stops, break-even shifts, and currency hedging',
    icon: Play,
    colorClass: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
    badgeClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
  },
  {
    id: 'notification-alert',
    type: 'notification',
    title: 'Forex Signal / Alert',
    category: 'Output',
    description: 'Broadcasts trade signals and margin warnings to Telegram/Discord',
    icon: Bell,
    colorClass: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
  },
]

// ==========================================
// Custom React Flow Node Components
// ==========================================

function GenericWorkflowNode(props: NodeProps) {
  const data = props.data as unknown as StandardNodeData

  const meta = useMemo(() => {
    switch (data.nodeType) {
      case 'action':
        return { icon: Play, title: 'Action', color: 'text-purple-500 border-purple-500/30 bg-purple-500/10' }
      case 'condition':
        return { icon: GitBranch, title: 'Condition', color: 'text-cyan-500 border-cyan-500/30 bg-cyan-500/10' }
      case 'intermediate':
        return { icon: Sparkles, title: 'Intermediate AI', color: 'text-indigo-500 border-indigo-500/30 bg-indigo-500/10' }
      case 'notification':
        return { icon: Bell, title: 'Notification', color: 'text-indigo-500 border-indigo-500/30 bg-indigo-500/10' }
      default:
        return { icon: Layers, title: 'Step', color: 'text-muted-foreground border-border bg-muted' }
    }
  }, [data.nodeType])

  const IconComponent = meta.icon

  return (
    <div className="min-w-[200px] rounded-xl border-2 border-border bg-card p-3 shadow-md transition-all hover:border-primary/50 text-left">
      {/* Target Handle strictly on the LEFT side */}
      <Handle
        type="target"
        position={Position.Left}
        id="target-left"
        className="!h-3 !w-3 !rounded-full !bg-muted-foreground !border-2 !border-background hover:scale-125 transition-transform"
      />

      <div className="flex items-center gap-2 pb-2 border-b border-border/60">
        <div className={`flex h-7 w-7 items-center justify-center rounded-lg border ${meta.color}`}>
          <IconComponent className="h-4 w-4" />
        </div>
        <div>
          <div className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground">{meta.title}</div>
          <div className="text-xs font-bold leading-none text-foreground">{data.label}</div>
        </div>
      </div>

      {data.subtitle && (
        <div className="pt-2 text-[11px] text-muted-foreground">
          {data.subtitle}
        </div>
      )}

      {/* Source Handle strictly on the RIGHT side */}
      <Handle
        type="source"
        position={Position.Right}
        id="source-right"
        className="!h-3 !w-3 !rounded-full !bg-primary !border-2 !border-background hover:scale-125 transition-transform"
      />
    </div>
  )
}

const nodeTypes = {
  ...triggerNodeTypes,
  ...intermediateNodeTypes,
  ...actionNodeTypes,
  condition: ConditionNode,
  notification: GenericWorkflowNode,
}

// ==========================================
// Storage and Persistence Helpers
// ==========================================

const WORKFLOW_STORAGE_KEY = 'forex_workflow_state_v2'

interface StoredWorkflowData {
  nodes: Node[]
  edges: Edge[]
  savedAt: string
  reason?: string
}

const defaultInitialNodes: Node[] = [
  {
    id: 'trigger-1',
    type: 'trigger',
    position: { x: 40, y: 70 },
    data: {
      label: 'EUR/USD > 1.0920 Breakout',
      nodeType: 'trigger',
      kind: 'price',
      asset: 'EUR/USD',
      price: '1.09200',
      condition: 'above',
      timer: 'Every 15s',
      subtitle: 'Currency spot rate monitoring',
    },
  },
  {
    id: 'trigger-2',
    type: 'trigger',
    position: { x: 40, y: 310 },
    data: {
      label: 'London / NY Overlap Session',
      nodeType: 'trigger',
      kind: 'timer',
      subtitle: 'High volatility liquidity window',
    },
  },
  {
    id: 'intermediate-gemini-1',
    type: 'intermediate',
    position: { x: 380, y: 50 },
    data: {
      label: 'Gemini: Market Sentiment Reasoner',
      nodeType: 'intermediate',
      intermediateKind: 'gemini',
      model: 'gemini-2.0-flash',
      credentialTitle: 'Google Gemini API Key',
      credentialKey: 'AIzaSyBv9xK72m8L10qPz-demo',
      promptTask: 'Analyze FX volatility, economic sentiment & validate trade setup',
      temperature: 0.2,
      subtitle: 'gemini-2.0-flash • Side Handles',
    },
  },
  {
    id: 'intermediate-claude-1',
    type: 'intermediate',
    position: { x: 380, y: 300 },
    data: {
      label: 'Claude: Risk & Trend Evaluator',
      nodeType: 'intermediate',
      intermediateKind: 'claude',
      model: 'claude-3-5-sonnet',
      credentialTitle: 'Anthropic API Key',
      credentialKey: 'sk-ant-api03-x88NmKwL20-demo',
      promptTask: 'Multi-timeframe trend confirmation & institutional risk filter',
      maxTokens: 2048,
      subtitle: 'claude-3-5-sonnet • Side Handles',
    },
  },
  {
    id: 'action-1',
    type: 'action',
    position: { x: 740, y: 175 },
    data: {
      label: 'MT5: Market Buy 1.00 Lot EUR/USD',
      nodeType: 'action',
      actionKind: 'lighter',
      pair: 'EUR/USD',
      side: 'buy',
      amount: '1.00 Lot',
      slippage: '0.5 pips',
      subtitle: 'SL: 20 pips • TP: 40 pips',
    },
  },
]

const defaultInitialEdges: Edge[] = [
  { id: 'edge-1', source: 'trigger-1', dest: 'intermediate-gemini-1' },
  { id: 'edge-2', source: 'trigger-2', dest: 'intermediate-claude-1' },
  { id: 'edge-3', source: 'intermediate-gemini-1', dest: 'action-1' },
  { id: 'edge-4', source: 'intermediate-claude-1', dest: 'action-1' },
]

function getStoredWorkflow(): StoredWorkflowData | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(WORKFLOW_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as StoredWorkflowData
  } catch (err) {
    console.error('Failed to load saved workflow:', err)
    return null
  }
}

function storeWorkflow(
  nodes: Node[],
  edges: Edge[],
  reason?: string
): string {
  if (typeof window === 'undefined') return ''
  const timestamp = new Date().toLocaleTimeString()
  const payload: StoredWorkflowData = {
    nodes,
    edges,
    savedAt: timestamp,
    reason,
  }
  try {
    localStorage.setItem(WORKFLOW_STORAGE_KEY, JSON.stringify(payload))
    return timestamp
  } catch (err) {
    console.error('Failed to save workflow to localStorage:', err)
    return ''
  }
}

// Convert custom Edge interface { id, source, dest } -> ReactFlowEdge { id, source, target }
function toReactFlowEdges(edges: Edge[]): ReactFlowEdge[] {
  return edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.dest,
    animated: true,
    style: { strokeWidth: 2 },
  }))
}

// ==========================================
// Main CreateWorkflow Component
// ==========================================

export interface CreateWorkflowProps {
  isDark?: boolean
}

export function CreateWorkflow({ isDark = true }: CreateWorkflowProps = {}) {
  const savedWorkflow = getStoredWorkflow()

  const [nodes, setNodes, onNodesChange] = useNodesState(
    savedWorkflow?.nodes?.length ? savedWorkflow.nodes : defaultInitialNodes
  )

  // Maintain our custom Edge[] interface state
  const [customEdges, setCustomEdges] = useState<Edge[]>(
    savedWorkflow?.edges?.length ? savedWorkflow.edges : defaultInitialEdges
  )

  const [lastSavedTime, setLastSavedTime] = useState<string | null>(
    savedWorkflow?.savedAt ?? null
  )
  const [saveStatus, setSaveStatus] = useState<string>(
    savedWorkflow ? `Restored (${savedWorkflow.savedAt})` : 'Default template'
  )

  const [showJsonInspector, setShowJsonInspector] = useState(false)

  // Synchronize React Flow edge representations
  const rfEdges = useMemo(() => toReactFlowEdges(customEdges), [customEdges])
  const [, , onRfEdgesChange] = useEdgesState(rfEdges)

  // Auto-save whenever an edge is added
  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target) return

      const newCustomEdge: Edge = {
        id: `edge_${params.source}_to_${params.target}_${Date.now()}`,
        source: params.source,
        dest: params.target,
      }

      setCustomEdges((prevEdges) => {
        // Prevent duplicate edge
        const exists = prevEdges.some(
          (e) => e.source === newCustomEdge.source && e.dest === newCustomEdge.dest
        )
        if (exists) return prevEdges

        const updatedEdges = [...prevEdges, newCustomEdge]
        setNodes((currentNodes) => {
          const time = storeWorkflow(currentNodes, updatedEdges, 'Edge added')
          if (time) {
            setLastSavedTime(time)
            setSaveStatus(`Edge (${newCustomEdge.source} ➔ ${newCustomEdge.dest}) added & saved at ${time}`)
          }
          return currentNodes
        })
        return updatedEdges
      })
    },
    [setNodes]
  )

  // Auto-save whenever a trigger is added via TriggerSheet
  const handleAddTriggerFromSheet = useCallback(
    (
      kind: TriggerKind,
      label: string,
      subtitle?: string,
      config?: Record<string, unknown>
    ) => {
      const nextId = `trigger_${Date.now()}`

      const newNode: Node = {
        id: nextId,
        type: 'trigger',
        position: {
          x: 180 + Math.floor(Math.random() * 200),
          y: 70 + Math.floor(Math.random() * 160),
        },
        data: {
          label,
          nodeType: 'trigger',
          kind,
          subtitle: subtitle || 'Configured via Trigger Sheet',
          ...(config || {}),
        },
      }

      setNodes((currentNodes) => {
        const updatedNodes = [...currentNodes, newNode]
        const time = storeWorkflow(updatedNodes, customEdges, `${kind} trigger added`)
        if (time) {
          setLastSavedTime(time)
          setSaveStatus(`Trigger "${label}" added & saved at ${time}`)
        }
        return updatedNodes
      })
    },
    [customEdges, setNodes]
  )

  // Auto-save whenever an action is added via ActionSheet
  const handleAddActionFromSheet = useCallback(
    (
      kind: ActionKind,
      label: string,
      subtitle?: string,
      config?: Record<string, unknown>
    ) => {
      const nextId = `action_${Date.now()}`

      const newNode: Node = {
        id: nextId,
        type: 'action',
        position: {
          x: 360 + Math.floor(Math.random() * 160),
          y: 80 + Math.floor(Math.random() * 180),
        },
        data: {
          label,
          nodeType: 'action',
          actionKind: kind,
          subtitle: subtitle || 'Configured via Action Sheet',
          ...(config || {}),
        },
      }

      setNodes((currentNodes) => {
        const updatedNodes = [...currentNodes, newNode]
        const time = storeWorkflow(updatedNodes, customEdges, `${kind} action added`)
        if (time) {
          setLastSavedTime(time)
          setSaveStatus(`Action "${label}" added & saved at ${time}`)
        }
        return updatedNodes
      })
    },
    [customEdges, setNodes]
  )

  // Auto-save whenever an intermediate AI or condition node is added via IntermediateSheet
  const handleAddIntermediateFromSheet = useCallback(
    (
      kind: IntermediateKind,
      label: string,
      subtitle?: string,
      config?: IntermediateConfig
    ) => {
      const nextId = `intermediate_${kind}_${Date.now()}`

      const newNode: Node = {
        id: nextId,
        type: 'intermediate',
        position: {
          x: 360 + Math.floor(Math.random() * 120),
          y: 90 + Math.floor(Math.random() * 160),
        },
        data: {
          label,
          nodeType: 'intermediate',
          intermediateKind: kind,
          subtitle: subtitle || 'Intermediate AI Reasoning',
          ...(config || {}),
        },
      }

      setNodes((currentNodes) => {
        const updatedNodes = [...currentNodes, newNode]
        const time = storeWorkflow(updatedNodes, customEdges, `${kind} intermediate node added`)
        if (time) {
          setLastSavedTime(time)
          setSaveStatus(`Intermediate "${label}" added & saved at ${time}`)
        }
        return updatedNodes
      })
    },
    [customEdges, setNodes]
  )

  // Manual save trigger
  const handleManualSave = useCallback(() => {
    const time = storeWorkflow(nodes, customEdges, 'Manual save')
    if (time) {
      setLastSavedTime(time)
      setSaveStatus(`Saved manually at ${time}`)
    }
  }, [nodes, customEdges])

  // Reset to initial workflow template
  const handleReset = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(WORKFLOW_STORAGE_KEY)
    }
    setNodes(defaultInitialNodes)
    setCustomEdges(defaultInitialEdges)
    setLastSavedTime(null)
    setSaveStatus('Reset to default template')
  }, [setNodes])

  return (
    <div className="w-full space-y-4 text-left">
      {/* Top Banner & Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-card border border-border shadow-sm">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-base font-semibold text-foreground tracking-tight">
              Forex Workflow Canvas
            </h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Connect Forex triggers with intermediate AI reasoning nodes (Gemini, ChatGPT, Claude) and MT5/cTrader execution actions.
          </p>
        </div>

        {/* Action Controls & Save Indicator */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Trigger Sheet Button */}
          <TriggerSheet onAddTrigger={handleAddTriggerFromSheet} />

          {/* Intermediate AI & Logic Sheet Button */}
          <IntermediateSheet onAddIntermediate={handleAddIntermediateFromSheet} />

          {/* Action Sheet Button */}
          <ActionSheet onAddAction={handleAddActionFromSheet} />

          <Button size="sm" variant="outline" onClick={handleManualSave} className="gap-1.5 h-8 text-xs">
            <Save className="h-3.5 w-3.5" />
            Save State
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowJsonInspector(!showJsonInspector)}
            className="gap-1.5 h-8 text-xs"
          >
            <Code2 className="h-3.5 w-3.5" />
            {showJsonInspector ? 'Hide Edge Data' : 'Inspect Edge Data'}
          </Button>

          <Button size="sm" variant="ghost" onClick={handleReset} className="gap-1.5 h-8 text-xs text-muted-foreground hover:text-foreground">
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>

          {/* Canvas State Stats */}
          <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted text-xs font-medium text-muted-foreground border border-border">
            <Database className="h-3.5 w-3.5 text-primary" />
            <span>{nodes.length} Nodes</span>
            <span>•</span>
            <span>{customEdges.length} Edges</span>
          </div>

          {/* Status Badge */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-medium">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>{saveStatus}</span>
          </div>
        </div>
      </div>

      {/* Main Flow Canvas Area - Full Width & Expanded Height */}
      <div className="w-full space-y-2.5">
        <div className="w-full h-[calc(100vh-210px)] min-h-[660px] rounded-xl border border-border bg-card overflow-hidden shadow-sm relative">
          <ReactFlow
            nodes={nodes}
            edges={rfEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onRfEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            colorMode={isDark ? 'dark' : 'light'}
            fitView
          >
            <Controls className="!bg-card !border-border !fill-foreground [&>button]:!border-border [&>button]:!bg-card [&>button]:!text-foreground" />
            <MiniMap
              zoomable
              pannable
              className="!bg-card !border !border-border !rounded-md"
              nodeColor={(n) => (n.type === 'trigger' ? 'var(--primary, #10b981)' : '#94a3b8')}
              maskColor={isDark ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.1)'}
            />
            <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
          </ReactFlow>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <span>
            💡 Use the <strong>+ Add Forex Trigger</strong> and <strong>+ Add Forex Action</strong> buttons above to add nodes to the canvas. Drag between node handles to create custom edges.
          </span>
          {lastSavedTime && <span>Auto-saved at: {lastSavedTime}</span>}
        </div>
      </div>

      {/* JSON Inspector for Custom Edge Interface */}
      {showJsonInspector && (
        <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-primary" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Custom Edge Interface Inspection (<code>Edge&#123; id, source, dest &#125;</code>)
              </h4>
            </div>
            <span className="text-xs text-muted-foreground font-mono">
              {customEdges.length} edge{customEdges.length === 1 ? '' : 's'} registered
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <div className="text-[11px] font-medium text-muted-foreground mb-1">
                Custom Edge Objects ({customEdges.length}):
              </div>
              <pre className="p-2.5 rounded-lg bg-card border border-border font-mono text-xs overflow-x-auto max-h-48">
                {JSON.stringify(customEdges, null, 2)}
              </pre>
            </div>

            <div>
              <div className="text-[11px] font-medium text-muted-foreground mb-1">
                Active Nodes ({nodes.length}):
              </div>
              <pre className="p-2.5 rounded-lg bg-card border border-border font-mono text-xs overflow-x-auto max-h-48">
                {JSON.stringify(
                  nodes.map((n) => ({
                    id: n.id,
                    type: n.type,
                    label: n.data.label,
                    kind: (n.data as TriggerNodeData).kind,
                  })),
                  null,
                  2
                )}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
