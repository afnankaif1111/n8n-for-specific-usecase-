import { Router, type Request, type Response } from 'express'
import { z } from 'zod'
import { NodeDefinition } from '../models/NodeDefinition'
import { isDBConnected } from '../db'
import { memoryStore } from '../memoryStore'

export const nodeRouter = Router()

// Standard initial nodes catalog matching our frontend components
export const STANDARD_NODES = [
  // Triggers
  {
    nodeId: 'trigger-price',
    title: 'Forex Rate Trigger',
    desc: 'Fires when currency pair exchange rate crosses target threshold',
    type: 'trigger',
    credentialType: null,
    category: 'Trigger',
  },
  {
    nodeId: 'trigger-timer',
    title: 'FX Session & Timer',
    desc: 'Schedules recurring execution or London/NY/Tokyo market sessions',
    type: 'trigger',
    credentialType: null,
    category: 'Trigger',
  },
  {
    nodeId: 'trigger-hyperliquid',
    title: 'MetaTrader 5 Trigger',
    desc: 'Monitors MT4/MT5 terminal margin, equity drawdown, or order fill alerts',
    type: 'trigger',
    credentialType: 'mt5',
    category: 'Trigger',
  },
  {
    nodeId: 'trigger-backpack',
    title: 'Economic Calendar',
    desc: 'Monitors US NFP, FOMC rate decisions, and CPI inflation releases',
    type: 'trigger',
    credentialType: 'calendar',
    category: 'Trigger',
  },
  {
    nodeId: 'trigger-lighter',
    title: 'Broker Spread & Liquidity',
    desc: 'Watches ECN broker bid/ask spreads, rollover swaps, and depth',
    type: 'trigger',
    credentialType: 'broker',
    category: 'Trigger',
  },

  // Actions
  {
    nodeId: 'action-lighter',
    title: 'MetaTrader 5 Action',
    desc: 'Dispatches market, limit, or stop orders directly to MT4/MT5 terminals',
    type: 'action',
    credentialType: 'mt5',
    category: 'Action',
  },
  {
    nodeId: 'action-hyperliquid',
    title: 'cTrader / FIX API Action',
    desc: 'Executes ultra-low latency institutional ECN orders via FIX 4.4 protocol',
    type: 'action',
    credentialType: 'ctrader',
    category: 'Action',
  },
  {
    nodeId: 'action-backpack',
    title: 'Forex Broker Router',
    desc: 'Routes spot forex trades to lowest spread broker (OANDA, IC Markets)',
    type: 'action',
    credentialType: 'broker',
    category: 'Action',
  },
  {
    nodeId: 'action-trade',
    title: 'FX Risk & Position Manager',
    desc: 'Automates trailing stop loss, break-even shift, and currency hedges',
    type: 'action',
    credentialType: null,
    category: 'Action',
  },

  // Intermediate AI & Logic Nodes
  {
    nodeId: 'intermediate-ict',
    title: 'Smart ICT Engine',
    desc: 'Sub-canvas studio for FVG, Order Blocks, Liquidity Sweeps, MSS & OTE linked to compiled C++ logic',
    type: 'intermediate',
    credentialType: null,
    category: 'AI / Intermediate',
  },
  {
    nodeId: 'intermediate-gemini',
    title: 'Google Gemini AI',
    desc: 'Multimodal AI reasoning on FX sentiment, macro releases & setup validation',
    type: 'intermediate',
    credentialType: 'gemini_api_key',
    category: 'AI / Intermediate',
  },
  {
    nodeId: 'intermediate-chatgpt',
    title: 'OpenAI ChatGPT',
    desc: 'GPT-4o trade setup validation, lot sizing, and slippage guard rules',
    type: 'intermediate',
    credentialType: 'openai_api_key',
    category: 'AI / Intermediate',
  },
  {
    nodeId: 'intermediate-claude',
    title: 'Anthropic Claude',
    desc: 'Multi-timeframe price action analysis, support/resistance & risk/reward filter',
    type: 'intermediate',
    credentialType: 'anthropic_api_key',
    category: 'AI / Intermediate',
  },

  // Conditions & Notifications
  {
    nodeId: 'condition-filter',
    title: 'Risk & Margin Check',
    desc: 'Branching logic evaluating free margin, spread, and ADR volatility',
    type: 'condition',
    credentialType: null,
    category: 'Logic',
  },
  {
    nodeId: 'notification-alert',
    title: 'Forex Signal / Alert',
    desc: 'Broadcasts trade signals and margin warnings to Telegram/Discord',
    type: 'notification',
    credentialType: 'webhook',
    category: 'Output',
  },
]

// GET /api/nodes
nodeRouter.get('/', async (_req: Request, res: Response): Promise<any> => {
  try {
    if (isDBConnected()) {
      let nodes = await NodeDefinition.find().sort({ type: 1, title: 1 }).lean()
      if (nodes.length === 0) {
        nodes = STANDARD_NODES as any
      }
      return res.json({ nodes })
    } else {
      const nodes = memoryStore.getAllNodes()
      return res.json({ nodes })
    }
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to fetch node definitions',
      details: (error as Error).message,
    })
  }
})

// POST /api/nodes/seed
nodeRouter.post('/seed', async (_req: Request, res: Response): Promise<any> => {
  try {
    if (isDBConnected()) {
      const results = []
      for (const node of STANDARD_NODES) {
        const upserted = await NodeDefinition.findOneAndUpdate(
          { nodeId: node.nodeId },
          { $set: node },
          { upsert: true, new: true }
        )
        results.push(upserted)
      }
      return res.json({
        message: `Seeded ${results.length} standard node definitions successfully`,
        count: results.length,
        nodes: results,
      })
    } else {
      memoryStore.seedDefaultNodes()
      const nodes = memoryStore.getAllNodes()
      return res.json({
        message: `Seeded ${nodes.length} standard node definitions successfully`,
        count: nodes.length,
        nodes,
      })
    }
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to seed node definitions',
      details: (error as Error).message,
    })
  }
})

// POST /api/nodes
nodeRouter.post('/', async (req: Request, res: Response): Promise<any> => {
  try {
    const NodeSchema = z.object({
      nodeId: z.string().min(1),
      title: z.string().min(1),
      desc: z.string().min(1),
      type: z.enum(['trigger', 'action', 'condition', 'notification', 'intermediate']),
      credentialType: z.string().optional().nullable(),
      category: z.string().optional(),
    })

    const parseResult = NodeSchema.safeParse(req.body)
    if (!parseResult.success) {
      return res.status(400).json({
        error: parseResult.error.errors[0]?.message || 'Validation failed',
      })
    }

    if (isDBConnected()) {
      const created = await NodeDefinition.findOneAndUpdate(
        { nodeId: parseResult.data.nodeId },
        { $set: parseResult.data },
        { upsert: true, new: true }
      )
      return res.status(201).json({ node: created })
    } else {
      const node = {
        id: parseResult.data.nodeId,
        ...parseResult.data,
        createdAt: new Date(),
      }
      memoryStore.nodes.set(parseResult.data.nodeId, node)
      return res.status(201).json({ node })
    }
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to create node definition',
      details: (error as Error).message,
    })
  }
})
