import { Router, text, type Request, type Response } from 'express'
import { createHash, timingSafeEqual } from 'node:crypto'
import { Workflow } from '../models/Workflow'
import { isDBConnected } from '../db'
import { memoryStore } from '../memoryStore'
import { runWorkflow } from '../engine/executor'
import { parseTradingViewBody } from '../engine/tradingview'
import { saveExecution } from '../engine/persist'

/**
 * Public webhook endpoints. These are NOT behind JWT auth because TradingView
 * cannot send headers; each trigger node carries its own secret token instead.
 */
export const hooksRouter = Router()

// TradingView sends text/plain when the alert message is not valid JSON.
hooksRouter.use(text({ type: ['text/*'], limit: '1mb' }))

const hash = (s: string) => createHash('sha256').update(s).digest()
const safeEqual = (a: string, b: string) => timingSafeEqual(hash(a), hash(b))

const WINDOW_MS = 60_000
const MAX_PER_WINDOW = 30
const hits = new Map<string, number[]>()
function rateLimited(key: string): boolean {
  const now = Date.now()
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS)
  recent.push(now)
  hits.set(key, recent)
  return recent.length > MAX_PER_WINDOW
}

async function loadWorkflow(id: string) {
  try {
    if (isDBConnected()) {
      const w = await Workflow.findById(id)
      return w ? { id: w._id.toString(), title: w.title, nodes: w.nodes as any[], edges: w.edges as any[] } : null
    }
    const w = memoryStore.findWorkflowById(id)
    return w ? { id: w.id, title: w.title, nodes: w.nodes as any[], edges: w.edges as any[] } : null
  } catch {
    return null // malformed id
  }
}

// POST /api/hooks/tradingview/:workflowId/:token
hooksRouter.post('/tradingview/:workflowId/:token', async (req: Request, res: Response): Promise<any> => {
  const workflowId = String(req.params.workflowId)
  const token = String(req.params.token)

  if (rateLimited(`${workflowId}:${token.slice(0, 8)}`)) return res.status(429).json({ error: 'Too many alerts' })

  const workflow = await loadWorkflow(workflowId)
  const trigger = workflow?.nodes.find(
    (n) => n?.data?.kind === 'tradingview' && typeof n.data.webhookToken === 'string' && safeEqual(n.data.webhookToken, token),
  )
  // Same response for unknown workflow and bad token, so ids cannot be probed.
  if (!workflow || !trigger) return res.status(404).json({ error: 'Not found' })

  const payload = parseTradingViewBody(req.body)

  const allowed = String(trigger.data.symbolFilter ?? '')
    .split(',')
    .map((s) => s.trim().toUpperCase().replace(/[/:]/g, ''))
    .filter(Boolean)
  const asset = String(payload.asset ?? '').toUpperCase().replace(/[/:]/g, '')
  if (allowed.length && !allowed.includes(asset)) {
    return res.status(200).json({ accepted: false, reason: `Symbol ${payload.asset ?? '(none)'} not in filter` })
  }

  // Reply inside TradingView's ~3s limit; the workflow (which may call AI) runs afterwards.
  res.status(202).json({ accepted: true })

  const startTime = new Date()
  try {
    const result = await runWorkflow(workflow, { triggerNodeId: String(trigger.id), payload })
    await saveExecution(workflow.id, result, startTime, new Date())
  } catch (err) {
    console.error('[hooks] tradingview run failed:', (err as Error).message)
  }
})
