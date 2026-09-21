import { useCallback, useState } from 'react'
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  BackgroundVariant,
  type Connection,
  type Edge,
  type Node,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Button } from '@/components/ui/button'
import { Plus, RotateCcw, CheckCircle2, Save, Database } from 'lucide-react'

const STORAGE_KEY = 'react_flow_saved_state'

interface FlowStorageData {
  nodes: Node[]
  edges: Edge[]
  savedAt: string
  reason?: string
}

const defaultNodes: Node[] = [
  {
    id: '1',
    type: 'input',
    data: { label: '🚀 Vite + React 19' },
    position: { x: 250, y: 25 },
    className: '!bg-card !text-card-foreground !border !border-border !rounded-lg !shadow-sm !px-4 !py-2 !font-medium',
  },
  {
    id: '2',
    data: { label: '🎨 Tailwind CSS v4' },
    position: { x: 100, y: 125 },
    className: '!bg-card !text-card-foreground !border !border-border !rounded-lg !shadow-sm !px-4 !py-2 !font-medium',
  },
  {
    id: '3',
    data: { label: '🧩 shadcn/ui Components' },
    position: { x: 400, y: 125 },
    className: '!bg-card !text-card-foreground !border !border-border !rounded-lg !shadow-sm !px-4 !py-2 !font-medium',
  },
  {
    id: '4',
    type: 'output',
    data: { label: '⚡ React Flow Canvas' },
    position: { x: 250, y: 250 },
    className: '!bg-primary !text-primary-foreground !border !border-primary !rounded-lg !shadow-md !px-4 !py-2 !font-semibold',
  },
]

const defaultEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true },
  { id: 'e1-3', source: '1', target: '3', animated: true },
  { id: 'e2-4', source: '2', target: '4' },
  { id: 'e3-4', source: '3', target: '4' },
]

function getStoredFlow(): FlowStorageData | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as FlowStorageData
  } catch (err) {
    console.error('Failed to parse saved flow state:', err)
    return null
  }
}

function storeFlow(nodes: Node[], edges: Edge[], reason?: string): string {
  if (typeof window === 'undefined') return ''
  const timestamp = new Date().toLocaleTimeString()
  const data: FlowStorageData = {
    nodes,
    edges,
    savedAt: timestamp,
    reason,
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    return timestamp
  } catch (err) {
    console.error('Failed to save flow state:', err)
    return ''
  }
}

export function FlowDemo() {
  // Load initially saved state or fall back to default template
  const initialData = getStoredFlow()
  const [nodes, setNodes, onNodesChange] = useNodesState(
    initialData?.nodes?.length ? initialData.nodes : defaultNodes
  )
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    initialData?.edges?.length ? initialData.edges : defaultEdges
  )

  const [lastSaved, setLastSaved] = useState<string | null>(initialData?.savedAt ?? null)
  const [saveStatus, setSaveStatus] = useState<string>(
    initialData ? `Restored from storage (${initialData.savedAt})` : 'Default canvas'
  )


  // Auto-save whenever an edge is added via handle connection
  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((currentEdges) => {
        const updatedEdges = addEdge({ ...params, animated: true }, currentEdges)
        setNodes((currentNodes) => {
          const time = storeFlow(currentNodes, updatedEdges, 'Edge added')
          if (time) {
            setLastSaved(time)
            setSaveStatus(`Edge connected & saved at ${time}`)
          }
          return currentNodes
        })
        return updatedEdges
      })
    },
    [setEdges, setNodes]
  )

  // Auto-save when adding a new node
  const handleAddNode = useCallback(() => {
    const nextIndex = nodes.length + 1
    const newNode: Node = {
      id: `node_${Date.now()}`,
      data: { label: `Node ${nextIndex}` },
      position: {
        x: Math.floor(Math.random() * 260) + 120,
        y: Math.floor(Math.random() * 200) + 80,
      },
      className:
        '!bg-card !text-card-foreground !border !border-border !rounded-lg !shadow-sm !px-4 !py-2 !font-medium',
    }

    setNodes((currentNodes) => {
      const updatedNodes = [...currentNodes, newNode]
      setEdges((currentEdges) => {
        const time = storeFlow(updatedNodes, currentEdges, `Node ${nextIndex} added`)
        if (time) {
          setLastSaved(time)
          setSaveStatus(`Node "${newNode.data.label}" added & saved at ${time}`)
        }
        return currentEdges
      })
      return updatedNodes
    })
  }, [nodes.length, setNodes, setEdges])

  // Manual save option
  const handleManualSave = useCallback(() => {
    const time = storeFlow(nodes, edges, 'Manual save')
    if (time) {
      setLastSaved(time)
      setSaveStatus(`Saved manually at ${time}`)
    }
  }, [nodes, edges])

  // Reset back to defaults and clear localStorage
  const handleReset = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
    }
    setNodes(defaultNodes)
    setEdges(defaultEdges)
    setLastSaved(null)
    setSaveStatus('Reset to default canvas')
  }, [setNodes, setEdges])

  return (
    <div className="space-y-3 w-full">
      {/* Action and status toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-muted/40 border border-border">
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleAddNode} className="gap-1.5 h-8">
            <Plus className="h-4 w-4" />
            Add Node
          </Button>

          <Button size="sm" variant="outline" onClick={handleManualSave} className="gap-1.5 h-8">
            <Save className="h-3.5 w-3.5" />
            Save Canvas
          </Button>

          <Button size="sm" variant="ghost" onClick={handleReset} className="gap-1.5 h-8 text-muted-foreground hover:text-foreground">
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
        </div>

        {/* Real-time persistence status badge */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground bg-background px-2.5 py-1 rounded-md border border-border">
            <Database className="h-3.5 w-3.5 text-primary" />
            <span>
              {nodes.length} {nodes.length === 1 ? 'node' : 'nodes'}, {edges.length} {edges.length === 1 ? 'edge' : 'edges'}
            </span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>{saveStatus}</span>
          </div>
        </div>
      </div>

      {/* React Flow Canvas */}
      <div className="w-full h-[480px] rounded-xl border border-border bg-card overflow-hidden shadow-sm relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
        >
          <Controls className="!bg-card !border-border !fill-foreground [&>button]:!border-border [&>button]:!bg-card [&>button]:!text-foreground" />
          <MiniMap
            zoomable
            pannable
            className="!bg-card !border !border-border !rounded-md"
            nodeColor={() => 'var(--primary, #000)'}
            maskColor="rgba(0, 0, 0, 0.1)"
          />
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
        </ReactFlow>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <span>
          💡 Connect two handles or click <strong>Add Node</strong> — every change is immediately saved to localStorage.
        </span>
        {lastSaved && <span>Last saved: {lastSaved}</span>}
      </div>
    </div>
  )
}
