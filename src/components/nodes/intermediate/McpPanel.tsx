import { useState } from 'react'
import { Plug, Plus, Trash2, FlaskConical, Check, X } from 'lucide-react'
import { api } from '@/lib/api'
import { useNodeField } from './useNodeField'

export interface McpServerConfig {
  id: string
  name: string
  enabled: boolean
  transport: 'http' | 'sse' | 'stdio'
  url?: string
  headersText?: string
  headers?: Record<string, string>
  command?: string
  argsText?: string
  args?: string[]
  allowedToolsText?: string
  allowedTools?: string[]
}

type TestState = { status: 'idle' | 'testing' } | { status: 'ok'; tools: string[] } | { status: 'error'; message: string }

function parseHeaders(text: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const line of text.split('\n')) {
    const i = line.indexOf(':')
    if (i > 0) out[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
  return out
}

const splitList = (text: string) => text.split(/[,\n]/).map((s) => s.trim()).filter(Boolean)
const inputCls = 'w-full text-[11px] rounded border border-border bg-background px-1.5 py-1 text-foreground'

export function McpPanel({ nodeId, data }: { nodeId: string; data: Record<string, unknown> }) {
  const [enabled, setEnabled] = useNodeField<boolean>(nodeId, 'mcpEnabled', data.mcpEnabled !== false)
  const [servers, setServers] = useNodeField<McpServerConfig[]>(nodeId, 'mcpServers', (data.mcpServers as McpServerConfig[]) ?? [])
  const [mode, setMode] = useNodeField<string>(nodeId, 'decisionMode', (data.decisionMode as string) ?? 'gate')
  const [maxIter, setMaxIter] = useNodeField<number>(nodeId, 'maxToolIterations', Number(data.maxToolIterations) || 6)
  const [tests, setTests] = useState<Record<string, TestState>>({})

  const update = (id: string, patch: Partial<McpServerConfig>) =>
    setServers(servers.map((s) => (s.id === id ? { ...s, ...patch } : s)))

  const add = () =>
    setServers([
      ...servers,
      { id: `mcp_${Date.now()}`, name: `server-${servers.length + 1}`, enabled: true, transport: 'http', url: '' },
    ])

  const test = async (s: McpServerConfig) => {
    setTests((t) => ({ ...t, [s.id]: { status: 'testing' } }))
    try {
      const res = await api.executions.testMcp({
        name: s.name,
        transport: s.transport,
        url: s.url,
        headers: s.headers,
        command: s.command,
        args: s.args,
      })
      setTests((t) => ({
        ...t,
        [s.id]: res.ok ? { status: 'ok', tools: res.tools.map((x: { name: string }) => x.name) } : { status: 'error', message: res.error ?? 'Failed' },
      }))
    } catch (err) {
      setTests((t) => ({ ...t, [s.id]: { status: 'error', message: (err as Error).message } }))
    }
  }

  const activeCount = servers.filter((s) => s.enabled).length

  return (
    <div className="nodrag nopan nowheel rounded-lg border border-border bg-muted/40 p-2 space-y-2 text-[11px]">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1 font-semibold text-foreground">
          <Plug className="h-3 w-3 text-amber-500" />
          MCP tools
          <span className="font-normal text-muted-foreground">
            ({enabled ? `${activeCount} server${activeCount === 1 ? '' : 's'}` : 'off'})
          </span>
        </span>
        <label className="flex items-center gap-1 cursor-pointer text-muted-foreground">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          Enabled
        </label>
      </div>

      {enabled && (
        <>
          {servers.map((s) => {
            const t = tests[s.id]
            return (
              <div key={s.id} className="rounded border border-border/70 bg-card p-1.5 space-y-1">
                <div className="flex items-center gap-1">
                  <input type="checkbox" checked={s.enabled} onChange={(e) => update(s.id, { enabled: e.target.checked })} />
                  <input className={inputCls} value={s.name} onChange={(e) => update(s.id, { name: e.target.value })} placeholder="name" />
                  <select
                    className="text-[11px] rounded border border-border bg-background px-1 py-1"
                    value={s.transport}
                    onChange={(e) => update(s.id, { transport: e.target.value as McpServerConfig['transport'] })}
                  >
                    <option value="http">HTTP</option>
                    <option value="sse">SSE</option>
                    <option value="stdio">stdio</option>
                  </select>
                  <button type="button" onClick={() => setServers(servers.filter((x) => x.id !== s.id))} className="text-muted-foreground hover:text-rose-500 cursor-pointer" title="Remove">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>

                {s.transport === 'stdio' ? (
                  <>
                    <input className={`${inputCls} font-mono`} value={s.command ?? ''} onChange={(e) => update(s.id, { command: e.target.value })} placeholder="command (npx)" />
                    <input
                      className={`${inputCls} font-mono`}
                      value={s.argsText ?? ''}
                      onChange={(e) => update(s.id, { argsText: e.target.value, args: e.target.value.split(/\s+/).filter(Boolean) })}
                      placeholder="args (-y @scope/server)"
                    />
                    <div className="text-[10px] text-amber-600 dark:text-amber-400">Runs on the server; requires MCP_ALLOW_STDIO=true.</div>
                  </>
                ) : (
                  <>
                    <input className={`${inputCls} font-mono`} value={s.url ?? ''} onChange={(e) => update(s.id, { url: e.target.value })} placeholder="https://host/mcp" />
                    <textarea
                      rows={2}
                      className={`${inputCls} font-mono resize-none`}
                      value={s.headersText ?? ''}
                      onChange={(e) => update(s.id, { headersText: e.target.value, headers: parseHeaders(e.target.value) })}
                      placeholder={'Authorization: Bearer …\n(one header per line)'}
                    />
                  </>
                )}

                <input
                  className={inputCls}
                  value={s.allowedToolsText ?? ''}
                  onChange={(e) => update(s.id, { allowedToolsText: e.target.value, allowedTools: splitList(e.target.value) })}
                  placeholder="allowed tools (comma-separated, empty = all)"
                />

                <div className="flex items-center justify-between gap-2">
                  <button type="button" onClick={() => test(s)} disabled={t?.status === 'testing'} className="flex items-center gap-1 text-amber-600 dark:text-amber-400 hover:underline cursor-pointer disabled:opacity-60">
                    <FlaskConical className="h-3 w-3" />
                    {t?.status === 'testing' ? 'Testing…' : 'Test & list tools'}
                  </button>
                  {t?.status === 'ok' && (
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 truncate" title={t.tools.join(', ')}>
                      <Check className="h-3 w-3 shrink-0" />
                      {t.tools.length} tool{t.tools.length === 1 ? '' : 's'}: {t.tools.slice(0, 3).join(', ')}
                      {t.tools.length > 3 ? '…' : ''}
                    </span>
                  )}
                  {t?.status === 'error' && (
                    <span className="flex items-center gap-1 text-rose-500 truncate" title={t.message}>
                      <X className="h-3 w-3 shrink-0" />
                      {t.message}
                    </span>
                  )}
                </div>
              </div>
            )
          })}

          <button type="button" onClick={add} className="flex items-center gap-1 text-foreground hover:underline cursor-pointer">
            <Plus className="h-3 w-3" /> Add MCP server
          </button>

          <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-border/60">
            <label className="space-y-0.5">
              <span className="text-[10px] text-muted-foreground">Decision</span>
              <select className={inputCls} value={mode} onChange={(e) => setMode(e.target.value)}>
                <option value="gate">Gate (reject stops branch)</option>
                <option value="advisory">Advisory (never stops)</option>
              </select>
            </label>
            <label className="space-y-0.5">
              <span className="text-[10px] text-muted-foreground">Max tool rounds</span>
              <input type="number" min={1} max={20} className={inputCls} value={maxIter} onChange={(e) => setMaxIter(Math.min(20, Math.max(1, Number(e.target.value) || 1)))} />
            </label>
          </div>
        </>
      )}
    </div>
  )
}
