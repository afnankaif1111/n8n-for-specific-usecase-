import { useEffect, useRef, useState } from 'react'
import type { Node } from '@xyflow/react'
import { Play, LogIn, CloudUpload, History, Loader2, CheckCircle2, XCircle, MinusCircle, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { WORKFLOW_ID_KEY, WORKFLOW_SYNC_EVENT } from '@/components/nodes/triggers/TradingViewTriggerNode'

interface RunPanelProps {
  nodes: Node[]
  edges: Array<{ id: string; source: string; dest: string }>
}

interface LogLine {
  timestamp: string
  step: string
  message: string
  status?: 'OK' | 'WARN' | 'SKIPPED' | 'FAILED'
}

const STATUS_ICON = {
  OK: <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0 mt-0.5" />,
  WARN: <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />,
  SKIPPED: <MinusCircle className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />,
  FAILED: <XCircle className="h-3 w-3 text-rose-500 shrink-0 mt-0.5" />,
}

export function RunPanel({ nodes, edges }: RunPanelProps) {
  const [user, setUser] = useState(() => api.auth.getUser())
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [logs, setLogs] = useState<LogLine[] | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [syncedAt, setSyncedAt] = useState<string | null>(null)
  const [history, setHistory] = useState<Array<{ id: string; status: string; startTime: string; log: LogLine[] }>>([])
  const [showHistory, setShowHistory] = useState(false)

  const signIn = async (mode: 'signIn' | 'signUp') => {
    setBusy(true)
    setError(null)
    try {
      const res = mode === 'signIn' ? await api.auth.signIn(email, password) : await api.auth.signUp(email, password)
      setUser(res.user)
      setPassword('')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  /** Save the canvas on the server (webhooks and runs execute the server copy). */
  const sync = async (): Promise<string> => {
    const payload = { title: 'Canvas workflow', nodes: nodes as unknown as any[], edges }
    let id = localStorage.getItem(WORKFLOW_ID_KEY)
    if (id) {
      try {
        await api.workflows.update(id, payload)
      } catch {
        id = null // stale id (e.g. server restarted with in-memory storage)
      }
    }
    if (!id) {
      const created = await api.workflows.create(payload)
      id = String(created.workflow.id ?? created.workflow._id)
      localStorage.setItem(WORKFLOW_ID_KEY, id)
    }
    window.dispatchEvent(new Event(WORKFLOW_SYNC_EVENT))
    setSyncedAt(new Date().toLocaleTimeString())
    return id
  }

  const loadHistory = async (id: string | null = localStorage.getItem(WORKFLOW_ID_KEY)) => {
    if (!id) return
    try {
      setHistory((await api.executions.getByWorkflow(id)).executions)
    } catch {
      setHistory([])
    }
  }

  const guarded = async (fn: () => Promise<void>) => {
    setBusy(true)
    setError(null)
    try {
      await fn()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const run = () =>
    guarded(async () => {
      const id = await sync()
      const res = await api.executions.run(id)
      setLogs(res.execution.log as LogLine[])
      setStatus(res.execution.status)
      await loadHistory(id)
    })

  // Keep the server copy current so live webhooks run the latest canvas.
  const firstRender = useRef(true)
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    if (!user || !localStorage.getItem(WORKFLOW_ID_KEY)) return
    const t = setTimeout(() => void sync().catch(() => undefined), 2000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges, user])

  const input = 'text-xs rounded-md border border-border bg-background px-2 py-1 text-foreground'

  return (
    <div className="rounded-xl border border-border bg-card p-3 space-y-2 text-left">
      <div className="flex flex-wrap items-center gap-2">
        {user ? (
          <>
            <Button size="sm" onClick={run} disabled={busy} className="gap-1.5 h-8 text-xs cursor-pointer">
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
              Run workflow
            </Button>
            <Button size="sm" variant="outline" disabled={busy} onClick={() => guarded(async () => void (await sync()))} className="gap-1.5 h-8 text-xs cursor-pointer">
              <CloudUpload className="h-3.5 w-3.5" />
              Sync to server
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={() => {
                setShowHistory(!showHistory)
                if (!showHistory) void loadHistory()
              }}
              className="gap-1.5 h-8 text-xs cursor-pointer"
            >
              <History className="h-3.5 w-3.5" />
              History
            </Button>
            <span className="text-xs text-muted-foreground">
              {user.email} · actions are dry-run only{syncedAt ? ` · synced ${syncedAt}` : ''}
            </span>
            <button type="button" className="text-xs text-muted-foreground hover:underline cursor-pointer ml-auto" onClick={() => { api.auth.signOut(); setUser(null) }}>
              Sign out
            </button>
          </>
        ) : (
          <>
            <LogIn className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Sign in to run workflows and test MCP servers:</span>
            <input className={input} placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input className={input} placeholder="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <Button size="sm" variant="outline" disabled={busy} onClick={() => signIn('signIn')} className="h-7 text-xs cursor-pointer">Sign in</Button>
            <Button size="sm" variant="ghost" disabled={busy} onClick={() => signIn('signUp')} className="h-7 text-xs cursor-pointer">Sign up</Button>
          </>
        )}
      </div>

      {error && <div className="text-xs text-rose-500">{error}</div>}

      {showHistory && (
        <div className="rounded-lg border border-border bg-muted/30 p-2 max-h-56 overflow-y-auto space-y-1">
          <div className="text-[11px] font-semibold text-foreground">Recent executions (includes webhook-triggered runs)</div>
          {history.length === 0 && <div className="text-[11px] text-muted-foreground">No runs yet. Sync the workflow first.</div>}
          {history.map((h) => (
            <button
              key={h.id}
              type="button"
              onClick={() => {
                setLogs(h.log)
                setStatus(h.status)
              }}
              className="w-full flex items-center justify-between text-[11px] font-mono text-left rounded px-1.5 py-0.5 hover:bg-muted cursor-pointer"
            >
              <span>{new Date(h.startTime).toLocaleString()}</span>
              <span className={h.status === 'SUCCESS' ? 'text-emerald-500' : 'text-rose-500'}>{h.status}</span>
            </button>
          ))}
        </div>
      )}

      {logs && (
        <div className="rounded-lg border border-border bg-muted/30 p-2 max-h-56 overflow-y-auto space-y-0.5">
          <div className="text-[11px] font-semibold text-foreground pb-1">Last run: {status}</div>
          {logs.map((l, i) => (
            <div key={i} className="flex items-start gap-1.5 text-[11px] font-mono text-muted-foreground">
              {STATUS_ICON[l.status ?? 'OK']}
              <span className="break-words min-w-0">{l.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
