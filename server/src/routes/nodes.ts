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
    title: 'Price Trigger',
    desc: 'Fires when asset price crosses target threshold on Binance, Pyth, or Chainlink',
    type: 'trigger',
    credentialType: null,
    category: 'Trigger',
  },
  {
    nodeId: 'trigger-timer',
    title: 'Timer Trigger',
    desc: 'Schedules recurring execution or cron delays',
    type: 'trigger',
    credentialType: null,
    category: 'Trigger',
  },
  {
    nodeId: 'trigger-hyperliquid',
    title: 'Hyperliquid Trigger',
    desc: 'Monitors Hyperliquid perp fills, funding rates, or liquidation alerts',
    type: 'trigger',
    credentialType: 'hyperliquid',
    category: 'Trigger',
  },
  {
    nodeId: 'trigger-backpack',
    title: 'Backpack Trigger',
    desc: 'Monitors Backpack spot exchange balances and order executions',
    type: 'trigger',
    credentialType: 'backpack',
    category: 'Trigger',
  },
  {
    nodeId: 'trigger-lighter',
    title: 'Lighter Trigger',
    desc: 'Watches Lighter DEX orderbook, depth, and spread changes',
    type: 'trigger',
    credentialType: 'lighter',
    category: 'Trigger',
  },

  // Actions
  {
    nodeId: 'action-lighter',
    title: 'Lighter DEX Action',
    desc: 'Dispatches limit, market, or cancel orders directly on Lighter DEX',
    type: 'action',
    credentialType: 'lighter',
    category: 'Action',
  },
  {
    nodeId: 'action-hyperliquid',
    title: 'Hyperliquid Perp Action',
    desc: 'Executes perpetual futures orders and margin management on Hyperliquid',
    type: 'action',
    credentialType: 'hyperliquid',
    category: 'Action',
  },
  {
    nodeId: 'action-backpack',
    title: 'Backpack Spot Action',
    desc: 'Executes spot order routing and swaps on Backpack Exchange',
    type: 'action',
    credentialType: 'backpack',
    category: 'Action',
  },
  {
    nodeId: 'action-trade',
    title: 'Universal Swap Router',
    desc: 'Dispatches optimal trades across DEX aggregators with slippage protection',
    type: 'action',
    credentialType: null,
    category: 'Action',
  },

  // Conditions & Notifications
  {
    nodeId: 'condition-filter',
    title: 'Logic / Condition',
    desc: 'Branching logic evaluating volatility, volume, or technical indicators',
    type: 'condition',
    credentialType: null,
    category: 'Logic',
  },
  {
    nodeId: 'notification-alert',
    title: 'Dispatch Alert',
    desc: 'Broadcasts notifications via Telegram, Discord, or Webhook',
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
      type: z.enum(['trigger', 'action', 'condition', 'notification']),
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
