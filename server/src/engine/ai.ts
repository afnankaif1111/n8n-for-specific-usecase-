/**
 * Provider-agnostic AI call with an MCP tool-use loop.
 *
 * Each provider adapter knows how to (a) send the conversation, (b) read back
 * text + tool calls and (c) append tool results. `runAI` drives the loop,
 * executing tool calls through the node's McpSession until the model answers.
 */
import { McpSession, type McpToolDef } from './mcp'

export type Provider = 'claude' | 'chatgpt' | 'gemini'

export interface AIRequest {
  provider: Provider
  model: string
  apiKey: string
  system: string
  user: string
  temperature?: number
  maxTokens: number
  maxToolIterations: number
}

export interface ToolCallRecord {
  tool: string
  args: Record<string, unknown>
  isError: boolean
  ms: number
  preview: string
}

export interface AIResult {
  text: string
  toolCalls: ToolCallRecord[]
  iterations: number
  stoppedByLimit: boolean
}

interface ModelTurn {
  text: string
  calls: Array<{ id: string; name: string; args: Record<string, unknown> }>
}

interface Adapter {
  step(): Promise<ModelTurn>
  addToolResults(results: Array<{ id: string; name: string; text: string; isError: boolean }>): void
}

const REQUEST_TIMEOUT_MS = 90_000

async function postJson(url: string, headers: Record<string, string>, body: unknown): Promise<any> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })
  const raw = await res.text()
  let json: any
  try {
    json = JSON.parse(raw)
  } catch {
    json = { raw }
  }
  if (!res.ok) {
    const msg = json?.error?.message ?? json?.error ?? json?.raw ?? res.statusText
    throw new Error(`${res.status} from provider: ${typeof msg === 'string' ? msg : JSON.stringify(msg)}`)
  }
  return json
}

/** The UI historically stored short aliases; map them to real API model ids. */
export function resolveModel(provider: Provider, model: string): string {
  const m = (model || '').trim()
  if (provider === 'claude') {
    const aliases: Record<string, string> = {
      'claude-3-5-sonnet': 'claude-sonnet-5-5',
      'claude-3-5-haiku': 'claude-haiku-5-5',
      'claude-3-opus': 'claude-opus-5-5',
      'claude-sonnet': 'claude-sonnet-5-5',
      'claude-haiku': 'claude-haiku-5-5',
      'claude-opus': 'claude-opus-5-5',
    }
    return aliases[m] ?? (m || 'claude-sonnet-5-5')
  }
  if (provider === 'chatgpt') return m || 'gpt-4o'
  return m || 'gemini-2.0-flash'
}

// --- Anthropic --------------------------------------------------------------

function claudeAdapter(req: AIRequest, tools: McpToolDef[]): Adapter {
  const messages: any[] = [{ role: 'user', content: req.user }]
  return {
    async step() {
      const body: Record<string, unknown> = {
        model: req.model,
        max_tokens: req.maxTokens,
        system: req.system,
        messages,
      }
      if (req.temperature !== undefined) body.temperature = req.temperature
      if (tools.length) {
        body.tools = tools.map((t) => ({ name: t.exposedName, description: t.description, input_schema: t.inputSchema }))
      }
      const json = await postJson(
        'https://api.anthropic.com/v1/messages',
        { 'x-api-key': req.apiKey, 'anthropic-version': '2023-06-01' },
        body,
      )
      const blocks: any[] = json.content ?? []
      messages.push({ role: 'assistant', content: blocks })
      return {
        text: blocks.filter((b) => b.type === 'text').map((b) => b.text).join('\n'),
        calls: blocks.filter((b) => b.type === 'tool_use').map((b) => ({ id: b.id, name: b.name, args: b.input ?? {} })),
      }
    },
    addToolResults(results) {
      messages.push({
        role: 'user',
        content: results.map((r) => ({ type: 'tool_result', tool_use_id: r.id, content: r.text, is_error: r.isError })),
      })
    },
  }
}

// --- OpenAI -----------------------------------------------------------------

function openaiAdapter(req: AIRequest, tools: McpToolDef[]): Adapter {
  const messages: any[] = [
    { role: 'system', content: req.system },
    { role: 'user', content: req.user },
  ]
  const reasoning = /^(o\d|gpt-5)/.test(req.model)
  return {
    async step() {
      const body: Record<string, unknown> = { model: req.model, messages, max_completion_tokens: req.maxTokens }
      if (req.temperature !== undefined && !reasoning) body.temperature = req.temperature
      if (tools.length) {
        body.tools = tools.map((t) => ({
          type: 'function',
          function: { name: t.exposedName, description: t.description, parameters: t.inputSchema },
        }))
      }
      const json = await postJson('https://api.openai.com/v1/chat/completions', { Authorization: `Bearer ${req.apiKey}` }, body)
      const msg = json.choices?.[0]?.message ?? {}
      messages.push(msg)
      const calls = (msg.tool_calls ?? []).map((c: any) => {
        let args: Record<string, unknown> = {}
        try {
          args = JSON.parse(c.function?.arguments || '{}')
        } catch {
          // leave empty; the tool will report missing arguments
        }
        return { id: c.id, name: c.function?.name, args }
      })
      return { text: msg.content ?? '', calls }
    },
    addToolResults(results) {
      for (const r of results) messages.push({ role: 'tool', tool_call_id: r.id, content: r.text })
    },
  }
}

// --- Gemini -----------------------------------------------------------------

/** Gemini accepts only an OpenAPI subset of JSON Schema. */
function geminiSchema(schema: unknown): unknown {
  if (Array.isArray(schema)) return schema.map(geminiSchema)
  if (!schema || typeof schema !== 'object') return schema
  const drop = new Set(['$schema', 'additionalProperties', '$id', '$ref', '$defs', 'definitions', 'default', 'examples', 'patternProperties'])
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(schema as Record<string, unknown>)) {
    if (!drop.has(k)) out[k] = geminiSchema(v)
  }
  return out
}

function geminiAdapter(req: AIRequest, tools: McpToolDef[]): Adapter {
  const contents: any[] = [{ role: 'user', parts: [{ text: req.user }] }]
  let counter = 0
  return {
    async step() {
      const generationConfig: Record<string, unknown> = { maxOutputTokens: req.maxTokens }
      if (req.temperature !== undefined) generationConfig.temperature = req.temperature
      const body: Record<string, unknown> = {
        systemInstruction: { parts: [{ text: req.system }] },
        contents,
        generationConfig,
      }
      if (tools.length) {
        body.tools = [
          {
            functionDeclarations: tools.map((t) => ({
              name: t.exposedName,
              description: t.description,
              parameters: geminiSchema(t.inputSchema),
            })),
          },
        ]
      }
      const json = await postJson(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(req.model)}:generateContent`,
        { 'x-goog-api-key': req.apiKey },
        body,
      )
      const content = json.candidates?.[0]?.content ?? { role: 'model', parts: [] }
      contents.push({ role: 'model', parts: content.parts ?? [] })
      const parts: any[] = content.parts ?? []
      return {
        text: parts.filter((p) => typeof p.text === 'string').map((p) => p.text).join('\n'),
        calls: parts
          .filter((p) => p.functionCall)
          .map((p) => ({ id: `gem_${counter++}`, name: p.functionCall.name, args: p.functionCall.args ?? {} })),
      }
    },
    addToolResults(results) {
      contents.push({
        role: 'user',
        parts: results.map((r) => ({
          functionResponse: { name: r.name, response: r.isError ? { error: r.text } : { result: r.text } },
        })),
      })
    },
  }
}

export async function runAI(req: AIRequest, mcp: McpSession | null, tools: McpToolDef[]): Promise<AIResult> {
  const adapter = req.provider === 'claude' ? claudeAdapter(req, tools) : req.provider === 'chatgpt' ? openaiAdapter(req, tools) : geminiAdapter(req, tools)
  const toolCalls: ToolCallRecord[] = []
  let text = ''

  for (let i = 1; i <= req.maxToolIterations + 1; i++) {
    const turn = await adapter.step()
    if (turn.text) text = turn.text
    if (!turn.calls.length || !mcp) return { text, toolCalls, iterations: i, stoppedByLimit: false }
    // The final allowed turn may still ask for tools; stop rather than loop forever.
    if (i > req.maxToolIterations) return { text, toolCalls, iterations: i, stoppedByLimit: true }

    const results = []
    for (const call of turn.calls) {
      const started = Date.now()
      const out = await mcp.callTool(call.name, call.args)
      toolCalls.push({
        tool: call.name,
        args: call.args,
        isError: out.isError,
        ms: Date.now() - started,
        preview: out.text.slice(0, 300),
      })
      results.push({ id: call.id, name: call.name, text: out.text, isError: out.isError })
    }
    adapter.addToolResults(results)
  }
  return { text, toolCalls, iterations: req.maxToolIterations + 1, stoppedByLimit: true }
}
