/**
 * Workflow executor.
 *
 * Walks the node graph in dependency order, passing each node's output to its
 * successors. A node can "halt" its branch (failed condition, AI rejection, no
 * ICT setup) which skips everything downstream of it on that path.
 *
 * Trading actions are DRY-RUN only: they report the order that would be sent.
 */
import { analyzeICT, normalizeCandles } from '../../../src/components/ict/engine'
import { createDefaultICTState } from '../../../src/components/ict/defaults'
import type { Candle, ICTStudioState } from '../../../src/components/ict/types'
import { McpSession, type McpServerConfig, type McpToolDef } from './mcp'
import { parseTradingViewBody } from './tradingview'
import { resolveModel, runAI, type Provider, type ToolCallRecord } from './ai'

type Json = Record<string, unknown>

export interface WorkflowGraph {
  id: string
  title: string
  nodes: Array<Record<string, any>>
  edges: Array<Record<string, any>>
}

export interface LogEntry {
  timestamp: string
  step: string
  message: string
  status?: 'OK' | 'WARN' | 'SKIPPED' | 'FAILED'
  nodeId?: string
  output?: unknown
}

export interface RunOptions {
  /** When set (webhook runs), only this trigger fires; other triggers are skipped. */
  triggerNodeId?: string
  /** Normalised payload delivered to the firing trigger. */
  payload?: Record<string, unknown>
}

export interface ExecutionResult {
  status: 'SUCCESS' | 'FAILED'
  logs: LogEntry[]
  outputs: Record<string, Json>
}

interface NodeOutcome {
  output: Json
  /** true = stop this branch (downstream nodes are skipped) */
  halt?: boolean
  message: string
  warnings?: string[]
}

const ENV_KEYS: Record<Provider, string[]> = {
  claude: ['ANTHROPIC_API_KEY'],
  chatgpt: ['OPENAI_API_KEY'],
  gemini: ['GEMINI_API_KEY', 'GOOGLE_API_KEY'],
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => (acc && typeof acc === 'object' ? (acc as Json)[key] : undefined), obj)
}

function toComparable(v: unknown): unknown {
  if (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))) return Number(v)
  return v
}

/** Shrink big payloads (candle arrays) before they are sent to a model or stored. */
function compact(value: unknown, depth = 0): unknown {
  if (Array.isArray(value)) {
    return value.length > 25 ? `[${value.length} items omitted]` : value.map((v) => compact(v, depth + 1))
  }
  if (value && typeof value === 'object' && depth < 6) {
    return Object.fromEntries(Object.entries(value as Json).map(([k, v]) => [k, compact(v, depth + 1)]))
  }
  return value
}

function parseJsonObject(text: string): Json | null {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start < 0 || end <= start) return null
  try {
    const parsed = JSON.parse(text.slice(start, end + 1))
    return parsed && typeof parsed === 'object' ? (parsed as Json) : null
  } catch {
    return null
  }
}

function findCandles(inputs: Json[]): Candle[] {
  for (let i = inputs.length - 1; i >= 0; i--) {
    const found = normalizeCandles(inputs[i].candles)
    if (found.length) return found
  }
  return []
}

// ---------------------------------------------------------------------------
// Node runners
// ---------------------------------------------------------------------------

function runTrigger(data: Json, payload?: Json): NodeOutcome {
  if (data.kind === 'tradingview') {
    // Webhook run: use the real alert. Manual run: fall back to the node's sample payload.
    const body = payload ?? parseTradingViewBody(data.samplePayload ?? '')
    return {
      message: payload
        ? `TradingView alert received: ${String(body.direction ?? 'signal')} ${String(body.asset ?? '')} ${body.price ?? ''}`.trim()
        : 'TradingView trigger fired with its sample payload (manual run)',
      warnings: !payload && !Object.keys(body).length ? ['no sample payload configured'] : undefined,
      output: { triggered: true, kind: 'tradingview', ...body },
    }
  }
  const price = Number(data.price)
  return {
    message: `Trigger fired (${String(data.kind ?? 'manual')})`,
    output: {
      triggered: true,
      kind: data.kind,
      asset: data.asset,
      condition: data.condition,
      ...(Number.isFinite(price) ? { price } : {}),
      ...(data.candlesJson ? { candles: safeParse(String(data.candlesJson)) } : {}),
    },
  }
}

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}

function runICT(data: Json, inputs: Json[]): NodeOutcome {
  const state = (data.studioState as ICTStudioState | undefined) ?? createDefaultICTState()
  const upstream = findCandles(inputs)
  const pasted = state.candlesJson ? normalizeCandles(safeParse(state.candlesJson)) : []
  const candles = upstream.length ? upstream : pasted
  const source = upstream.length ? 'upstream node' : pasted.length ? 'studio candles' : 'none'

  if (!candles.length) {
    return {
      halt: true,
      message: 'ICT engine has no candles: connect a node that outputs `candles` or paste candles in the ICT studio. Refusing to evaluate synthetic data.',
      output: { ict: null, direction: 'NEUTRAL', shouldExecute: false },
    }
  }

  const result = analyzeICT(candles, state)
  const { signals, ...summary } = result
  return {
    halt: !result.shouldExecute,
    message: `ICT ${result.direction} @ ${result.confluenceScore}% (BUY ${result.scores?.buy}% / SELL ${result.scores?.sell}%) from ${candles.length} candles via ${source}${result.blockedBy ? ` — ${result.blockedBy}` : ''}`,
    output: {
      ict: { ...summary, signals },
      direction: result.direction,
      confluenceScore: result.confluenceScore,
      entry: result.entryPrice,
      stopLoss: result.stopLoss,
      takeProfit: result.takeProfit,
      riskReward: result.riskRewardRatio,
    },
  }
}

interface Rule {
  field: string
  op: string
  value?: unknown
}

function evalRule(rule: Rule, context: Json): { ok: boolean; actual: unknown } {
  const actual = getPath(context, rule.field)
  const a = toComparable(actual)
  const b = toComparable(rule.value)
  switch (rule.op) {
    case 'exists':
      return { ok: actual !== undefined && actual !== null, actual }
    case 'contains':
      return { ok: String(actual ?? '').toLowerCase().includes(String(rule.value ?? '').toLowerCase()), actual }
    case '==':
      return { ok: a === b || String(a) === String(b), actual }
    case '!=':
      return { ok: !(a === b || String(a) === String(b)), actual }
    default: {
      if (typeof a !== 'number' || typeof b !== 'number') return { ok: false, actual }
      const ops: Record<string, boolean> = { '>': a > b, '>=': a >= b, '<': a < b, '<=': a <= b }
      return { ok: ops[rule.op] ?? false, actual }
    }
  }
}

function runCondition(data: Json, context: Json): NodeOutcome {
  const rules = (Array.isArray(data.rules) ? data.rules : []) as Rule[]
  if (!rules.length) {
    return {
      halt: false,
      message: 'Condition has no structured rules, passing through (add rules to make it a real filter)',
      warnings: ['no rules configured'],
      output: { passed: true },
    }
  }
  const results = rules.map((r) => ({ ...r, ...evalRule(r, context) }))
  const passed = data.combinator === 'any' ? results.some((r) => r.ok) : results.every((r) => r.ok)
  return {
    halt: !passed,
    message: `Condition ${passed ? 'passed' : 'failed'}: ${results.map((r) => `${r.field} ${r.op} ${r.value ?? ''} (got ${JSON.stringify(r.actual)}) ${r.ok ? '✓' : '✗'}`).join('; ')}`,
    output: { passed, rules: results },
  }
}

function resolveKey(provider: Provider, inline: unknown): string | null {
  const key = typeof inline === 'string' ? inline.trim() : ''
  if (key && !/demo/i.test(key)) return key
  for (const name of ENV_KEYS[provider]) if (process.env[name]) return process.env[name]!
  return null
}

async function runAINode(provider: Provider, data: Json, byNode: Json, nodeId: string, logTools: (calls: ToolCallRecord[]) => void): Promise<NodeOutcome> {
  const apiKey = resolveKey(provider, data.credentialKey)
  if (!apiKey) {
    throw new Error(`No API key for ${provider}: enter a real key on the node or set ${ENV_KEYS[provider].join(' / ')} on the server`)
  }

  const servers = (Array.isArray(data.mcpServers) ? data.mcpServers : []) as McpServerConfig[]
  const useMcp = data.mcpEnabled !== false && servers.some((s) => s.enabled !== false)
  const session = useMcp ? new McpSession() : null
  const warnings: string[] = []
  let tools: McpToolDef[] = []

  try {
    if (session) {
      tools = await session.connect(servers)
      for (const e of session.errors) warnings.push(`MCP "${e.server}" unavailable: ${e.error}`)
    }

    const gate = data.decisionMode !== 'advisory'
    const system = [
      String(data.promptTask || 'Evaluate the incoming trading signal.'),
      '',
      'You are one automated step in a trading workflow. The user message holds the outputs of the upstream nodes as JSON.',
      tools.length ? 'You may call the provided tools to gather more information before deciding.' : '',
      'When finished, reply with ONLY a JSON object: {"decision":"APPROVE"|"REJECT","confidence":0-1,"reasoning":"short explanation"}.',
      'Reject when evidence is missing or contradictory.',
    ]
      .filter(Boolean)
      .join('\n')

    const model = resolveModel(provider, String(data.model ?? ''))
    const temperature = Number(data.temperature)
    const result = await runAI(
      {
        provider,
        model,
        apiKey,
        system,
        user: JSON.stringify({ node: nodeId, inputs: compact(byNode) }, null, 1).slice(0, 40_000),
        temperature: Number.isFinite(temperature) ? temperature : undefined,
        maxTokens: Math.max(256, Number(data.maxTokens) || 2048),
        maxToolIterations: Math.min(20, Math.max(1, Number(data.maxToolIterations) || 6)),
      },
      session,
      tools,
    )
    logTools(result.toolCalls)

    const parsed = parseJsonObject(result.text)
    const decision = typeof parsed?.decision === 'string' ? parsed.decision.toUpperCase() : null
    if (result.stoppedByLimit) warnings.push('tool-iteration limit reached before the model finished')
    if (!decision) warnings.push('model did not return a parsable decision JSON')

    // Fail closed: a gate that cannot read the model's verdict does not let the trade through.
    const halt = gate && decision !== 'APPROVE'
    return {
      halt,
      warnings,
      message: `${provider}/${model} → ${decision ?? 'NO DECISION'}${tools.length ? ` (${result.toolCalls.length} MCP tool call(s) across ${tools.length} available tool(s))` : ''}`,
      output: {
        aiDecision: decision,
        confidence: parsed?.confidence,
        reasoning: parsed?.reasoning ?? result.text.slice(0, 1000),
        text: result.text,
        toolCalls: result.toolCalls.map((c) => ({ tool: c.tool, isError: c.isError, ms: c.ms })),
        model,
      },
    }
  } finally {
    await session?.close()
  }
}

function runPositionSize(data: Json, context: Json): NodeOutcome {
  const balance = Number(data.accountBalance)
  const riskPct = Number(data.riskPercent)
  const pipValue = Number(data.pipValuePerLot) || 10
  const maxLots = Number(data.maxLots) || 100
  const entry = Number(context.entry ?? context.price)
  const stop = Number(context.stopLoss)

  if (!(balance > 0) || !(riskPct > 0)) throw new Error('Position size needs accountBalance and riskPercent > 0')
  // Fail closed: without a real stop distance the risk cannot be bounded.
  if (!Number.isFinite(entry) || !Number.isFinite(stop) || entry === stop) {
    return { halt: true, message: 'No usable entry/stop-loss from upstream, cannot size the position', output: {} }
  }
  const pip = entry >= 500 ? 0.1 : entry >= 20 ? 0.01 : 0.0001
  const slPips = Math.abs(entry - stop) / pip
  const riskAmount = (balance * riskPct) / 100
  const raw = riskAmount / (slPips * pipValue)
  const lots = Math.min(maxLots, Math.floor(raw * 100) / 100)
  if (lots < 0.01) {
    return { halt: true, message: `Risk ${riskAmount.toFixed(2)} over ${slPips.toFixed(1)}p stop is below the 0.01 lot minimum`, output: { lots: 0, slPips, riskAmount } }
  }
  return {
    message: `${lots} lots risks ${(lots * slPips * pipValue).toFixed(2)} (${riskPct}% of ${balance}) over a ${slPips.toFixed(1)}p stop`,
    output: { lots, slPips: Number(slPips.toFixed(1)), riskAmount: Number(riskAmount.toFixed(2)) },
  }
}

function runAction(data: Json, context: Json): NodeOutcome {
  const side = String(context.direction ?? data.side ?? '').toUpperCase()
  const order = {
    venue: data.actionKind,
    pair: data.pair ?? data.asset ?? context.asset,
    side: side || 'UNSPECIFIED',
    amount: context.lots !== undefined ? `${context.lots} lots` : data.amount,
    entry: context.entry ?? context.price,
    stopLoss: context.stopLoss,
    takeProfit: context.takeProfit,
  }
  return {
    message: `DRY-RUN ${order.side} ${order.pair ?? ''} ${order.amount ?? ''} (no order sent — exchange execution is not wired in)`,
    output: { dryRun: true, order },
  }
}

// ---------------------------------------------------------------------------
// Graph walk
// ---------------------------------------------------------------------------

export async function runWorkflow(workflow: WorkflowGraph, opts: RunOptions = {}): Promise<ExecutionResult> {
  const logs: LogEntry[] = []
  const log = (e: Omit<LogEntry, 'timestamp'>) => logs.push({ timestamp: new Date().toISOString(), ...e })

  const nodes = Array.isArray(workflow.nodes) ? workflow.nodes : []
  const edges = (Array.isArray(workflow.edges) ? workflow.edges : [])
    .map((e) => ({ source: String(e.source), target: String(e.dest ?? e.target) }))
    .filter((e) => e.source && e.target)
  const byId = new Map(nodes.map((n) => [String(n.id), n]))
  const outputs: Record<string, Json> = {}
  /** Everything a node and its ancestors produced, so late nodes still see early data (e.g. ICT entry/SL/TP). */
  const carried: Record<string, Json> = {}

  log({ step: 'init', message: `Starting "${workflow.title}" with ${nodes.length} node(s), ${edges.length} edge(s)` })

  const incoming = new Map<string, string[]>()
  for (const n of nodes) incoming.set(String(n.id), [])
  for (const e of edges) {
    if (byId.has(e.source) && byId.has(e.target)) incoming.get(e.target)!.push(e.source)
    else log({ step: 'graph_validation', status: 'WARN', message: `Ignoring edge ${e.source} → ${e.target}: unknown node` })
  }

  // Kahn topological sort.
  const indegree = new Map([...incoming].map(([id, srcs]) => [id, srcs.length]))
  const order: string[] = []
  const queue = [...indegree].filter(([, d]) => d === 0).map(([id]) => id)
  while (queue.length) {
    const id = queue.shift()!
    order.push(id)
    for (const [target, srcs] of incoming) {
      if (srcs.includes(id)) {
        const d = indegree.get(target)! - srcs.filter((s) => s === id).length
        indegree.set(target, d)
        if (d === 0) queue.push(target)
      }
    }
  }
  if (order.length !== nodes.length) {
    log({ step: 'graph_validation', status: 'FAILED', message: 'Workflow contains a cycle; refusing to run' })
    return { status: 'FAILED', logs, outputs }
  }

  const state = new Map<string, 'ok' | 'halted' | 'skipped' | 'failed'>()
  let failed = false

  for (const id of order) {
    const node = byId.get(id)!
    const data = (node.data ?? {}) as Json
    const type = String(node.type ?? data.nodeType ?? 'step')
    const label = String(data.label ?? id)
    const sources = incoming.get(id)!

    if (type === 'trigger' && opts.triggerNodeId && opts.triggerNodeId !== id) {
      state.set(id, 'skipped')
      continue
    }
    const live = sources.filter((s) => state.get(s) === 'ok')

    if (sources.length && !live.length) {
      state.set(id, 'skipped')
      log({ step: `node_${id}`, nodeId: id, status: 'SKIPPED', message: `${label}: skipped, no upstream branch reached it` })
      continue
    }

    const inputs = live.map((s) => carried[s])
    const upstream: Json = Object.assign({}, ...inputs)
    const context: Json = { ...upstream, nodes: outputs }

    try {
      let outcome: NodeOutcome
      if (type === 'trigger') outcome = runTrigger(data, id === opts.triggerNodeId ? opts.payload : undefined)
      else if (type === 'action' || type === 'notification') outcome = runAction(data, context)
      else if (type === 'intermediate' || type === 'condition') {
        const kind = String(data.intermediateKind ?? data.kind ?? '').toLowerCase()
        if (kind === 'smart-ict' || kind === 'ict') outcome = runICT(data, inputs)
        else if (kind === 'position-size') outcome = runPositionSize(data, context)
        else if (kind === 'condition' || kind === 'risk') outcome = runCondition(data, context)
        else {
          const provider: Provider = kind === 'claude' || kind === 'anthropic' ? 'claude' : kind === 'chatgpt' || kind === 'openai' || kind === 'gpt' ? 'chatgpt' : 'gemini'
          outcome = await runAINode(provider, data, upstream, id, (calls) => {
            for (const c of calls) {
              log({
                step: `mcp_${id}`,
                nodeId: id,
                status: c.isError ? 'WARN' : 'OK',
                message: `MCP tool ${c.tool}(${JSON.stringify(c.args).slice(0, 200)}) → ${c.isError ? 'error: ' : ''}${c.preview.slice(0, 160)} [${c.ms}ms]`,
              })
            }
          })
        }
      } else outcome = { message: `Unhandled node type "${type}", passed through`, output: {} }

      outputs[id] = outcome.output
      carried[id] = { ...upstream, ...outcome.output }
      state.set(id, outcome.halt ? 'halted' : 'ok')
      for (const w of outcome.warnings ?? []) log({ step: `node_${id}`, nodeId: id, status: 'WARN', message: `${label}: ${w}` })
      log({
        step: `node_${id}`,
        nodeId: id,
        status: outcome.halt ? 'SKIPPED' : 'OK',
        message: `${label}: ${outcome.message}${outcome.halt ? ' — branch stopped' : ''}`,
        output: compact(outcome.output),
      })
    } catch (err) {
      failed = true
      state.set(id, 'failed')
      log({ step: `node_${id}`, nodeId: id, status: 'FAILED', message: `${label}: ${(err as Error).message}` })
    }
  }

  log({ step: 'finish', message: failed ? 'Execution finished with errors' : 'Execution finished' })
  return { status: failed ? 'FAILED' : 'SUCCESS', logs, outputs }
}
