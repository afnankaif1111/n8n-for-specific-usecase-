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
import { triggerNodeTypes } from '@/components/nodes/triggers'
import { actionNodeTypes } from '@/components/nodes/actions'
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
  Plus,
  Database,
  Layers,
  Code2
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
export type { ActionKind }

export type NodeType = 'trigger' | 'action' | 'condition' | 'notification'

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
  nodeType: 'action' | 'condition' | 'notification'
  actionKind?: ActionKind
  subtitle?: string
  config?: Record<string, unknown>
  pair?: string
  side?: string
  amount?: string
  price?: string
  actionType?: string
  slippage?: string
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
    title: 'Price Trigger',
    category: 'Trigger',
    description: 'Fires when asset price crosses or reaches target threshold',
    icon: TrendingUp,
    colorClass: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
  },
  {
    id: 'trigger-timer',
    type: 'trigger',
    kind: 'timer',
    title: 'Timer Trigger',
    category: 'Trigger',
    description: 'Schedules recurring execution or cron delays',
    icon: Clock,
    colorClass: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
  },
  {
    id: 'trigger-hyperliquid',
    type: 'trigger',
    kind: 'hyperliquid',
    title: 'Hyperliquid Trigger',
    category: 'Trigger',
    description: 'Listens to Hyperliquid perp fills, funding, or liquidation alerts',
    icon: Zap,
    colorClass: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  },
  {
    id: 'trigger-backpack',
    type: 'trigger',
    kind: 'backpack',
    title: 'Backpack Trigger',
    category: 'Trigger',
    description: 'Monitors Backpack spot exchange balances and order executions',
    icon: Briefcase,
    colorClass: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
    badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
  },
  {
    id: 'trigger-lighter',
    type: 'trigger',
    kind: 'lighter',
    title: 'Lighter Trigger',
    category: 'Trigger',
    description: 'Watches Lighter orderbook, DEX depth, and spread changes',
    icon: Flame,
    colorClass: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
    badgeClass: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30',
  },

  // Action nodes (including Lighter DEX)
  {
    id: 'action-lighter',
    type: 'action',
    actionKind: 'lighter',
    title: 'Lighter DEX Action',
    category: 'Action',
    description: 'Dispatches limit or market orders directly on Lighter DEX',
    icon: Flame,
    colorClass: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
    badgeClass: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30',
  },
  {
    id: 'action-hyperliquid',
    type: 'action',
    actionKind: 'hyperliquid',
    title: 'Hyperliquid Perp Action',
    category: 'Action',
    description: 'Executes perpetual futures orders on Hyperliquid DEX',
    icon: Zap,
    colorClass: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  },
  {
    id: 'action-backpack',
    type: 'action',
    actionKind: 'backpack',
    title: 'Backpack Spot Action',
    category: 'Action',
    description: 'Executes spot order routing and swaps on Backpack Exchange',
    icon: Briefcase,
    colorClass: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
    badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
  },
  {
    id: 'action-trade',
    type: 'action',
    actionKind: 'trade',
    title: 'Universal Swap Router',
    category: 'Action',
    description: 'Dispatches optimal trades across DEX aggregators',
    icon: Play,
    colorClass: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
    badgeClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
  },
  {
    id: 'condition-filter',
    type: 'condition',
    title: 'Logic / Condition',
    category: 'Logic',
    description: 'Branching logic evaluating volatility, volume, or RSI',
    icon: GitBranch,
    colorClass: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
    badgeClass: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
  },
  {
    id: 'notification-alert',
    type: 'notification',
    title: 'Alert Notification',
    category: 'Output',
    description: 'Broadcasts notification via Telegram, Discord, or Webhook',
    icon: Bell,
    colorClass: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
    badgeClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
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
      case 'notification':
        return { icon: Bell, title: 'Notification', color: 'text-indigo-500 border-indigo-500/30 bg-indigo-500/10' }
      default:
        return { icon: Layers, title: 'Step', color: 'text-muted-foreground border-border bg-muted' }
    }
  }, [data.nodeType])

  const IconComponent = meta.icon

  return (
    <div className="min-w-[200px] rounded-xl border-2 border-border bg-card p-3 shadow-md transition-all hover:border-primary/50">
      <Handle
        type="target"
        position={Position.Top}
        className="!h-3 !w-3 !rounded-full !bg-muted-foreground !border-2 !border-background"
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

      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-3 !w-3 !rounded-full !bg-primary !border-2 !border-background"
      />
    </div>
  )
}

const nodeTypes = {
  ...triggerNodeTypes,
  ...actionNodeTypes,
  condition: GenericWorkflowNode,
  notification: GenericWorkflowNode,
}

// ==========================================
// Storage and Persistence Helpers
// ==========================================

const WORKFLOW_STORAGE_KEY = 'created_workflow_state_v1'

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
    position: { x: 80, y: 40 },
    data: {
      label: 'BTC > $95,000 Threshold',
      nodeType: 'trigger',
      kind: 'price',
      asset: 'BTC/USDT',
      price: '95,000',
      condition: 'above',
      timer: 'Every 15s',
      subtitle: 'Asset price monitoring',
    },
  },
  {
    id: 'trigger-2',
    type: 'trigger',
    position: { x: 340, y: 40 },
    data: {
      label: 'Hyperliquid Position Check',
      nodeType: 'trigger',
      kind: 'hyperliquid',
      subtitle: 'Listen for liquidation buffer',
    },
  },
  {
    id: 'condition-1',
    type: 'condition',
    position: { x: 210, y: 190 },
    data: {
      label: 'Evaluate Risk / Margin',
      nodeType: 'condition',
      subtitle: 'Margin Ratio > 20%',
    },
  },
  {
    id: 'action-1',
    type: 'action',
    position: { x: 210, y: 320 },
    data: {
      label: 'Backpack Spot Rebalance',
      nodeType: 'action',
      actionKind: 'backpack',
      subtitle: 'Execute order via API',
    },
  },
]

const defaultInitialEdges: Edge[] = [
  { id: 'edge-1', source: 'trigger-1', dest: 'condition-1' },
  { id: 'edge-2', source: 'trigger-2', dest: 'condition-1' },
  { id: 'edge-3', source: 'condition-1', dest: 'action-1' },
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

export function CreateWorkflow() {
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

  // Auto-save whenever a node is added from the types of nodes list
  const handleAddNodeFromList = useCallback(
    (item: NodeTypeItem) => {
      const nextId = `${item.type}_${Date.now()}`
      const nodeCount = nodes.length + 1

      const isPrice = item.kind === 'price'
      const newNode: Node = {
        id: nextId,
        type: item.type,
        position: {
          x: 180 + Math.floor(Math.random() * 200),
          y: 100 + Math.floor(Math.random() * 180),
        },
        data: item.type === 'trigger'
          ? {
              label: `${item.title} #${nodeCount}`,
              nodeType: 'trigger',
              kind: item.kind ?? 'price',
              subtitle: item.description,
              ...(isPrice ? {
                asset: 'BTC/USDT',
                price: '95,000',
                condition: 'above',
                timer: 'Every 15s',
              } : {}),
            }
          : item.type === 'action'
          ? {
              label: `${item.title} #${nodeCount}`,
              nodeType: 'action',
              actionKind: item.actionKind || 'lighter',
              subtitle: item.description,
              ...(item.actionKind === 'lighter' ? {
                pair: 'ETH-PERP',
                side: 'buy',
                amount: '0.5 ETH',
                actionType: 'market',
                slippage: '0.5%',
              } : item.actionKind === 'hyperliquid' ? {
                pair: 'ETH-PERP',
                side: 'Long',
                leverage: '5x',
              } : item.actionKind === 'backpack' ? {
                pair: 'SOL/USDC',
                side: 'Buy',
              } : {}),
            }
          : {
              label: `${item.title} #${nodeCount}`,
              nodeType: item.type,
              subtitle: item.description,
            },
      }

      setNodes((currentNodes) => {
        const updatedNodes = [...currentNodes, newNode]
        const time = storeWorkflow(updatedNodes, customEdges, `${item.title} added`)
        if (time) {
          setLastSavedTime(time)
          setSaveStatus(`Node "${item.title}" added & saved at ${time}`)
        }
        return updatedNodes
      })
    },
    [nodes.length, customEdges, setNodes]
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
              Create Workflow Canvas
            </h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Connect triggers (Price, Timer, Hyperliquid, Backpack, Lighter) with actions using custom edges.
          </p>
        </div>

        {/* Action Controls & Save Indicator */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Trigger Sheet Button */}
          <TriggerSheet onAddTrigger={handleAddTriggerFromSheet} />

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

          {/* Status Badge */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-medium">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>{saveStatus}</span>
          </div>
        </div>
      </div>

      {/* Main Layout: Node Types List (Palette) + Flow Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Sidebar: Types of Nodes List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="p-3.5 rounded-xl bg-card border border-border shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm">Types of Nodes</h3>
              </div>
              <span className="text-[11px] font-medium text-muted-foreground">
                Click to add & save
              </span>
            </div>

            {/* Trigger Nodes Section */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                <span>Trigger Nodes (5 Kinds)</span>
                <TriggerSheet
                  onAddTrigger={handleAddTriggerFromSheet}
                  triggerElement={
                    <button
                      type="button"
                      className="text-[10px] text-primary hover:underline font-medium cursor-pointer"
                    >
                      Open Sheet
                    </button>
                  }
                />
              </div>
              <div className="space-y-1.5">
                {NODE_TYPES_LIST.filter((n) => n.type === 'trigger').map((item) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleAddNodeFromList(item)}
                      className="w-full flex items-start gap-2.5 p-2 rounded-lg border border-border bg-background hover:bg-muted/60 hover:border-primary/40 transition-all text-left group"
                    >
                      <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${item.colorClass}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                            {item.title}
                          </span>
                          <span className={`text-[9px] font-semibold px-1 rounded border ${item.badgeClass}`}>
                            {item.kind}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-1">
                          {item.description}
                        </p>
                      </div>
                      <Plus className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Other Workflow Nodes Section */}
            <div className="space-y-1.5 pt-2 border-t border-border">
              <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                <span>Actions & Logic (with Lighter)</span>
                <ActionSheet
                  onAddAction={handleAddActionFromSheet}
                  triggerElement={
                    <button
                      type="button"
                      className="text-[10px] text-orange-600 dark:text-orange-400 hover:underline font-medium cursor-pointer"
                    >
                      Open Sheet
                    </button>
                  }
                />
              </div>
              <div className="space-y-1.5">
                {NODE_TYPES_LIST.filter((n) => n.type !== 'trigger').map((item) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleAddNodeFromList(item)}
                      className="w-full flex items-start gap-2.5 p-2 rounded-lg border border-border bg-background hover:bg-muted/60 hover:border-primary/40 transition-all text-left group"
                    >
                      <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${item.colorClass}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                            {item.title}
                          </span>
                          <span className="text-[9px] font-medium text-muted-foreground">
                            {item.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-1">
                          {item.description}
                        </p>
                      </div>
                      <Plus className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Real-time stats */}
          <div className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5 text-primary" />
              <span>Canvas State:</span>
            </div>
            <div className="flex items-center gap-2 font-medium text-foreground">
              <span>{nodes.length} Nodes</span>
              <span>•</span>
              <span>{customEdges.length} Custom Edges</span>
            </div>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="lg:col-span-8 space-y-3">
          <div className="w-full h-[520px] rounded-xl border border-border bg-card overflow-hidden shadow-sm relative">
            <ReactFlow
              nodes={nodes}
              edges={rfEdges}
              onNodesChange={onNodesChange}
              onEdgesChange={onRfEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              fitView
            >
              <Controls className="!bg-card !border-border !fill-foreground [&>button]:!border-border [&>button]:!bg-card [&>button]:!text-foreground" />
              <MiniMap
                zoomable
                pannable
                className="!bg-card !border !border-border !rounded-md"
                nodeColor={(n) => (n.type === 'trigger' ? 'var(--primary, #6366f1)' : '#94a3b8')}
                maskColor="rgba(0, 0, 0, 0.1)"
              />
              <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
            </ReactFlow>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span>
              💡 Drag between node handles to create a custom <strong>Edge</strong> (persists with <code>source</code> &amp; <code>dest</code>).
            </span>
            {lastSavedTime && <span>Auto-saved at: {lastSavedTime}</span>}
          </div>
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
