import { Router, type Response } from 'express'
import { Execution } from '../models/Execution'
import { Workflow } from '../models/Workflow'
import { isDBConnected } from '../db'
import { memoryStore } from '../memoryStore'
import { saveExecution } from '../engine/persist'
import { runWorkflow } from '../engine/executor'
import { probeMcpServer } from '../engine/mcp'
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth'

export const executionRouter = Router()

executionRouter.use(requireAuth)

// GET /api/executions
executionRouter.get('/', async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.userId || ''

    if (isDBConnected()) {
      const userWorkflows = await Workflow.find({ userId }).select('_id')
      const workflowIds = userWorkflows.map((w) => w._id)

      const executions = await Execution.find({ workflowId: { $in: workflowIds } })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean()

      const formatted = executions.map((e: any) => ({
        ...e,
        id: e._id.toString(),
      }))
      return res.json({ executions: formatted })
    } else {
      const userWorkflows = memoryStore.findWorkflowsByUserId(userId)
      const workflowIds = userWorkflows.map((w) => w.id)
      const executions = memoryStore.findExecutionsByUserWorkflows(workflowIds)
      return res.json({ executions })
    }
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to fetch executions',
      details: (error as Error).message,
    })
  }
})

// GET /api/executions/:workflowId
executionRouter.get('/:workflowId', async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.userId || ''

    if (isDBConnected()) {
      const workflow = await Workflow.findOne({
        _id: req.params.workflowId,
        userId,
      })
      if (!workflow) {
        return res.status(404).json({ error: 'Workflow not found or access denied' })
      }

      const executions = await Execution.find({ workflowId: workflow._id })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean()

      const formatted = executions.map((e: any) => ({
        ...e,
        id: e._id.toString(),
      }))
      return res.json({ executions: formatted })
    } else {
      const workflow = memoryStore.findWorkflowById(req.params.workflowId, userId)
      if (!workflow) {
        return res.status(404).json({ error: 'Workflow not found or access denied' })
      }
      const executions = memoryStore.findExecutionsByWorkflowId(req.params.workflowId)
      return res.json({ executions })
    }
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to retrieve workflow executions',
      details: (error as Error).message,
    })
  }
})

// POST /api/executions/mcp/test  — connect to an MCP server and list its tools
executionRouter.post('/mcp/test', async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const cfg = req.body ?? {}
    if (typeof cfg.name !== 'string' || !cfg.name.trim()) {
      return res.status(400).json({ error: 'MCP server name is required' })
    }
    const tools = await probeMcpServer(cfg)
    return res.json({ ok: true, tools })
  } catch (error) {
    return res.status(200).json({ ok: false, error: (error as Error).message })
  }
})

// POST /api/executions/run/:workflowId
executionRouter.post('/run/:workflowId', async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.userId || ''
    let workflow: { id: string; title: string; nodes: any[]; edges: any[] } | null = null

    if (isDBConnected()) {
      const dbWorkflow = await Workflow.findOne({
        _id: req.params.workflowId,
        userId,
      })
      if (dbWorkflow) {
        workflow = {
          id: dbWorkflow._id.toString(),
          title: dbWorkflow.title,
          nodes: dbWorkflow.nodes,
          edges: dbWorkflow.edges,
        }
      }
    } else {
      const memWorkflow = memoryStore.findWorkflowById(req.params.workflowId, userId)
      if (memWorkflow) {
        workflow = memWorkflow
      }
    }

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found or access denied' })
    }

    const startTime = new Date()
    const result = await runWorkflow(workflow)
    const endTime = new Date()
    const message =
      result.status === 'SUCCESS' ? 'Workflow execution finished' : 'Workflow execution finished with errors'

    const execution = await saveExecution(workflow.id, result, startTime, endTime)
    return res.status(201).json({ message, execution })
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to run workflow execution',
      details: (error as Error).message,
    })
  }
})
