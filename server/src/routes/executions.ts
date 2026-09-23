import { Router, type Response } from 'express'
import { Execution } from '../models/Execution'
import { Workflow } from '../models/Workflow'
import { isDBConnected } from '../db'
import { memoryStore } from '../memoryStore'
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
    const logs: Array<Record<string, unknown>> = []

    logs.push({
      timestamp: startTime.toISOString(),
      step: 'init',
      message: `Starting execution for workflow "${workflow.title}" (ID: ${workflow.id})`,
    })

    const nodeCount = Array.isArray(workflow.nodes) ? workflow.nodes.length : 0
    const edgeCount = Array.isArray(workflow.edges) ? workflow.edges.length : 0

    logs.push({
      timestamp: new Date().toISOString(),
      step: 'graph_validation',
      message: `Workflow loaded with ${nodeCount} node(s) and ${edgeCount} edge(s)`,
    })

    // Simulate step evaluation through workflow nodes
    if (Array.isArray(workflow.nodes)) {
      for (const node of workflow.nodes as Array<any>) {
        const nodeType = node?.type || node?.data?.nodeType || 'step'
        const label = node?.data?.label || node?.id || 'Unknown Node'
        const kind = node?.data?.kind || node?.data?.actionKind || ''

        logs.push({
          timestamp: new Date().toISOString(),
          step: `node_${node?.id || 'item'}`,
          message: `Evaluated [${nodeType.toUpperCase()}] ${label} ${kind ? `(${kind})` : ''}`,
          status: 'OK',
        })
      }
    }

    const endTime = new Date()
    logs.push({
      timestamp: endTime.toISOString(),
      step: 'finish',
      message: `Execution completed successfully in ${endTime.getTime() - startTime.getTime()}ms`,
    })

    if (isDBConnected()) {
      const execution = await Execution.create({
        workflowId: workflow.id,
        status: 'SUCCESS',
        log: logs,
        startTime,
        endTime,
      })

      return res.status(201).json({
        message: 'Workflow execution finished successfully',
        execution: {
          id: execution._id.toString(),
          workflowId: execution.workflowId,
          status: execution.status,
          startTime: execution.startTime,
          endTime: execution.endTime,
          durationMs: endTime.getTime() - startTime.getTime(),
          log: execution.log,
        },
      })
    } else {
      const execution = memoryStore.createExecution({
        workflowId: workflow.id,
        status: 'SUCCESS',
        log: logs,
        startTime,
        endTime,
      })

      return res.status(201).json({
        message: 'Workflow execution finished successfully',
        execution: {
          id: execution.id,
          workflowId: execution.workflowId,
          status: execution.status,
          startTime: execution.startTime,
          endTime: execution.endTime,
          durationMs: endTime.getTime() - startTime.getTime(),
          log: execution.log,
        },
      })
    }
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to run workflow execution',
      details: (error as Error).message,
    })
  }
})
