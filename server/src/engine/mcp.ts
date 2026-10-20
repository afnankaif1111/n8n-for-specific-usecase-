/**
 * MCP (Model Context Protocol) client used by AI nodes.
 *
 * An AI node lists the MCP servers it may use; at run time we connect to each,
 * discover their tools, hand those tools to the model and execute the calls the
 * model makes. Connections live only for the duration of one node execution.
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js'

export interface McpServerConfig {
  id?: string
  name: string
  enabled?: boolean
  /** `http` = Streamable HTTP (falls back to SSE), `sse` = legacy SSE, `stdio` = local subprocess */
  transport?: 'http' | 'sse' | 'stdio'
  url?: string
  headers?: Record<string, string>
  command?: string
  args?: string[]
  env?: Record<string, string>
  /** If set, only these tool names are exposed to the model. */
  allowedTools?: string[]
}

export interface McpToolDef {
  /** Name exposed to the model: `<server>__<tool>`, sanitised. */
  exposedName: string
  server: string
  tool: string
  description: string
  inputSchema: Record<string, unknown>
}

export interface McpToolResult {
  text: string
  isError: boolean
}

const TOOL_TIMEOUT_MS = 30_000
const CONNECT_TIMEOUT_MS = 15_000
const MAX_RESULT_CHARS = 20_000

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'server'
}

function withTimeout<T>(promise: Promise<T>, ms: number, what: string): Promise<T> {
  let timer: NodeJS.Timeout
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${what} timed out after ${ms}ms`)), ms)
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer))
}

function isPrivateHost(host: string): boolean {
  const h = host.toLowerCase().replace(/^\[|\]$/g, '')
  if (h === 'localhost' || h.endsWith('.localhost') || h === '::1') return true
  const m = h.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/)
  if (!m) return false
  const [a, b] = [Number(m[1]), Number(m[2])]
  return a === 10 || a === 127 || a === 0 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)
}

/** Reject URLs that could be used to reach cloud metadata or (in production) internal services. */
export function assertSafeMcpUrl(raw: string): URL {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    throw new Error(`Invalid MCP server URL: ${raw}`)
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error(`MCP URL must be http(s): ${raw}`)
  }
  if (/^169\.254\./.test(url.hostname) || url.hostname === 'metadata.google.internal') {
    throw new Error('MCP URL points at a link-local / metadata address, which is blocked')
  }
  const allowLocal = process.env.MCP_ALLOW_LOCAL
    ? process.env.MCP_ALLOW_LOCAL === 'true'
    : process.env.NODE_ENV !== 'production'
  if (!allowLocal && isPrivateHost(url.hostname)) {
    throw new Error('MCP URL points at a local/private host; set MCP_ALLOW_LOCAL=true to allow it')
  }
  return url
}

function buildTransports(cfg: McpServerConfig): Array<() => Transport> {
  const kind = cfg.transport ?? (cfg.command ? 'stdio' : 'http')

  if (kind === 'stdio') {
    if (process.env.MCP_ALLOW_STDIO !== 'true') {
      throw new Error(
        `MCP server "${cfg.name}" uses stdio, which runs a local command. Set MCP_ALLOW_STDIO=true on the server to enable it.`,
      )
    }
    if (!cfg.command) throw new Error(`MCP server "${cfg.name}" is missing a command`)
    const command = cfg.command
    return [
      () =>
        new StdioClientTransport({
          command,
          args: cfg.args ?? [],
          env: { ...(process.env as Record<string, string>), ...(cfg.env ?? {}) },
        }),
    ]
  }

  if (!cfg.url) throw new Error(`MCP server "${cfg.name}" is missing a URL`)
  const url = assertSafeMcpUrl(cfg.url)
  const requestInit: RequestInit = { headers: cfg.headers ?? {} }
  const http = () => new StreamableHTTPClientTransport(url, { requestInit })
  const sse = () => new SSEClientTransport(url, { requestInit, eventSourceInit: { fetch: (u, init) => fetch(u, { ...init, headers: { ...(init?.headers as Record<string, string>), ...(cfg.headers ?? {}) } }) } })
  return kind === 'sse' ? [sse] : [http, sse]
}

interface Connection {
  cfg: McpServerConfig
  slug: string
  client: Client
}

export class McpSession {
  private connections = new Map<string, Connection>()
  private tools = new Map<string, McpToolDef>()
  /** Servers that failed to connect, so the node log can say why. */
  readonly errors: Array<{ server: string; error: string }> = []

  async connect(servers: McpServerConfig[]): Promise<McpToolDef[]> {
    const usedSlugs = new Set<string>()

    await Promise.all(
      servers
        .filter((s) => s.enabled !== false)
        .map(async (cfg) => {
          let serverSlug = slug(cfg.name)
          for (let i = 2; usedSlugs.has(serverSlug); i++) serverSlug = `${slug(cfg.name)}_${i}`
          usedSlugs.add(serverSlug)

          try {
            const factories = buildTransports(cfg)
            let client: Client | undefined
            let lastError: unknown
            for (const make of factories) {
              const candidate = new Client({ name: 'nb-workflow', version: '1.0.0' }, { capabilities: {} })
              try {
                await withTimeout(candidate.connect(make()), CONNECT_TIMEOUT_MS, `Connecting to "${cfg.name}"`)
                client = candidate
                break
              } catch (err) {
                lastError = err
                await candidate.close().catch(() => undefined)
              }
            }
            if (!client) throw lastError instanceof Error ? lastError : new Error(String(lastError))

            const listed = await withTimeout(client.listTools(), CONNECT_TIMEOUT_MS, `Listing tools of "${cfg.name}"`)
            const allowed = cfg.allowedTools?.length ? new Set(cfg.allowedTools) : null
            this.connections.set(serverSlug, { cfg, slug: serverSlug, client })

            for (const tool of listed.tools) {
              if (allowed && !allowed.has(tool.name)) continue
              const exposedName = `${serverSlug}__${tool.name}`.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64)
              this.tools.set(exposedName, {
                exposedName,
                server: serverSlug,
                tool: tool.name,
                description: tool.description ?? `${tool.name} (via ${cfg.name})`,
                inputSchema: (tool.inputSchema as Record<string, unknown>) ?? { type: 'object', properties: {} },
              })
            }
          } catch (err) {
            this.errors.push({ server: cfg.name, error: (err as Error).message })
          }
        }),
    )

    return [...this.tools.values()]
  }

  async callTool(exposedName: string, args: Record<string, unknown>): Promise<McpToolResult> {
    const def = this.tools.get(exposedName)
    const conn = def ? this.connections.get(def.server) : undefined
    if (!def || !conn) return { text: `Unknown tool "${exposedName}"`, isError: true }

    try {
      const res = await withTimeout(
        conn.client.callTool({ name: def.tool, arguments: args }),
        TOOL_TIMEOUT_MS,
        `Tool ${def.tool}`,
      )
      const parts = Array.isArray(res.content) ? res.content : []
      let text = parts
        .map((p: { type: string; text?: string; mimeType?: string }) =>
          p.type === 'text' ? (p.text ?? '') : `[${p.type}${p.mimeType ? ` ${p.mimeType}` : ''} content omitted]`,
        )
        .join('\n')
      if (!text && res.structuredContent) text = JSON.stringify(res.structuredContent)
      if (text.length > MAX_RESULT_CHARS) text = `${text.slice(0, MAX_RESULT_CHARS)}\n…[truncated]`
      return { text: text || '(empty result)', isError: res.isError === true }
    } catch (err) {
      return { text: `Tool call failed: ${(err as Error).message}`, isError: true }
    }
  }

  async close(): Promise<void> {
    await Promise.all([...this.connections.values()].map((c) => c.client.close().catch(() => undefined)))
    this.connections.clear()
    this.tools.clear()
  }
}

/** Probe a server (used by the "Test connection" endpoint). */
export async function probeMcpServer(cfg: McpServerConfig) {
  const session = new McpSession()
  try {
    const tools = await session.connect([{ ...cfg, enabled: true, allowedTools: undefined }])
    if (session.errors.length) throw new Error(session.errors[0].error)
    return tools.map((t) => ({ name: t.tool, description: t.description }))
  } finally {
    await session.close()
  }
}
