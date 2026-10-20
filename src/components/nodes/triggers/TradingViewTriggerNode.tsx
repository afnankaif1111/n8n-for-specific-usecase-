import { useEffect, useState } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Webhook, Copy, Check, RefreshCw } from 'lucide-react'
import { useNodeField } from '@/components/nodes/intermediate/useNodeField'

export interface TradingViewTriggerData extends Record<string, unknown> {
  label: string
  kind?: 'tradingview'
  webhookToken?: string
  symbolFilter?: string
  publicBaseUrl?: string
  samplePayload?: string
  subtitle?: string
}

export const WORKFLOW_ID_KEY = 'nb_server_workflow_id'
export const WORKFLOW_SYNC_EVENT = 'nb-workflow-synced'

const DEFAULT_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/api\/?$/, '')
const SAMPLE = '{"symbol":"{{ticker}}","action":"BUY","price":{{close}},"sl":0,"tp":0,"interval":"{{interval}}"}'
const FILLED_SAMPLE = '{"symbol":"EURUSD","action":"BUY","price":1.0945,"sl":1.0920,"tp":1.1000,"interval":"15"}'

const field = 'w-full text-[11px] rounded border border-border bg-background px-1.5 py-1 text-foreground font-mono'

function CopyButton({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      type="button"
      title={label}
      onClick={() => {
        navigator.clipboard?.writeText(text).then(() => {
          setDone(true)
          setTimeout(() => setDone(false), 1200)
        })
      }}
      className="text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
    >
      {done ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
    </button>
  )
}

export function TradingViewTriggerNode(props: NodeProps) {
  const data = props.data as unknown as TradingViewTriggerData
  const [token, setToken] = useNodeField<string>(props.id, 'webhookToken', data.webhookToken ?? '')
  const [filter, setFilter] = useNodeField<string>(props.id, 'symbolFilter', data.symbolFilter ?? '')
  const [base, setBase] = useNodeField<string>(props.id, 'publicBaseUrl', data.publicBaseUrl ?? DEFAULT_BASE)
  const [sample, setSample] = useNodeField<string>(props.id, 'samplePayload', data.samplePayload ?? FILLED_SAMPLE)
  const [open, setOpen] = useState(false)
  const [workflowId, setWorkflowId] = useState(() => localStorage.getItem(WORKFLOW_ID_KEY))

  // Every webhook needs its own unguessable secret.
  useEffect(() => {
    if (!token) setToken(crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '').slice(0, 8))
  }, [token, setToken])

  useEffect(() => {
    const onSync = () => setWorkflowId(localStorage.getItem(WORKFLOW_ID_KEY))
    window.addEventListener(WORKFLOW_SYNC_EVENT, onSync)
    return () => window.removeEventListener(WORKFLOW_SYNC_EVENT, onSync)
  }, [])

  const url = workflowId && token ? `${base.replace(/\/$/, '')}/api/hooks/tradingview/${workflowId}/${token}` : ''
  const isLocal = /localhost|127\.0\.0\.1/.test(base)

  return (
    <div className={`min-w-[240px] ${open ? 'max-w-[340px]' : 'max-w-[280px]'} rounded-xl border-2 border-border bg-card p-3 shadow-md transition-all hover:border-sky-500/50 text-left`}>
      <div className="flex items-center justify-between pb-2 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-sky-500/30 bg-sky-500/10 text-sky-500">
            <Webhook className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground">Trigger</div>
            <div className="text-xs font-bold leading-none text-foreground">TradingView Alert</div>
          </div>
        </div>
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded border border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400">
          Webhook
        </span>
      </div>

      <div className="pt-2 space-y-1.5">
        <div className="text-xs font-medium text-foreground">{data.label || 'TradingView Alert Webhook'}</div>

        {url ? (
          <div className="flex items-center gap-1 rounded border border-border/60 bg-muted/40 px-1.5 py-1">
            <span className="font-mono text-[10px] text-muted-foreground truncate" title={url}>
              {url.replace(/^https?:\/\//, '').replace(/(\/tradingview\/[^/]+\/).+$/, '$1••••••')}
            </span>
            <CopyButton text={url} label="Copy webhook URL" />
          </div>
        ) : (
          <div className="text-[10px] text-amber-600 dark:text-amber-400">
            Sign in and run or sync the workflow (Run panel) to get this webhook URL.
          </div>
        )}
        {url && isLocal && (
          <div className="text-[10px] text-amber-600 dark:text-amber-400">
            localhost isn't reachable by TradingView: expose the API (ngrok / Cloudflare Tunnel) and set the public URL below.
          </div>
        )}

        <button type="button" onClick={() => setOpen(!open)} className="text-[10px] text-sky-600 dark:text-sky-400 hover:underline cursor-pointer">
          {open ? 'Hide setup' : 'Setup & alert message'}
        </button>

        {open && (
          <div className="nodrag nopan nowheel space-y-1.5 rounded-lg border border-border bg-muted/40 p-2 text-[10px]">
            <label className="block space-y-0.5">
              <span className="text-muted-foreground">Public base URL (what TradingView can reach)</span>
              <input className={field} value={base} onChange={(e) => setBase(e.target.value)} />
            </label>
            <label className="block space-y-0.5">
              <span className="text-muted-foreground">Only accept symbols (comma-separated, empty = all)</span>
              <input className={field} value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="EURUSD, GBPUSD" />
            </label>

            <div className="space-y-0.5">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Paste into the TradingView alert's Message box</span>
                <CopyButton text={SAMPLE} label="Copy alert message" />
              </div>
              <pre className="rounded border border-border bg-background p-1 font-mono text-[10px] whitespace-pre-wrap break-all">{SAMPLE}</pre>
              <div className="text-muted-foreground">
                Set the alert's Webhook URL to the URL above. Requires a paid TradingView plan. Optional keys: <code>sl</code>, <code>tp</code>, <code>candles</code>.
              </div>
            </div>

            <label className="block space-y-0.5">
              <span className="text-muted-foreground">Sample payload (used by manual “Run workflow”)</span>
              <textarea rows={3} className={`${field} resize-none`} value={sample} onChange={(e) => setSample(e.target.value)} spellCheck={false} />
            </label>

            <button
              type="button"
              onClick={() => {
                if (window.confirm('Regenerate the secret? The old webhook URL stops working.')) setToken('')
              }}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <RefreshCw className="h-3 w-3" /> Regenerate secret
            </button>
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} className="!h-3 !w-3 !rounded-full !bg-sky-500 !border-2 !border-background" />
    </div>
  )
}
