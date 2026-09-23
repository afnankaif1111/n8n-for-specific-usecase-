import { Router, type Response } from 'express'
import { z } from 'zod'
import { Workflow } from '../models/Workflow'
import { isDBConnected } from '../db'
import { memoryStore } from '../memoryStore'
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth'

export const workflowRouter = Router()

workflowRouter.use(requireAuth)

const WorkflowCreateSchema = z.object({
  title: z.string().min(1, 'Workflow title is required').default('Untitled Workflow'),
  nodes: z.array(z.record(z.unknown())).default([]),
  edges: z.array(z.record(z.unknown())).default([]),
})

const WorkflowUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  nodes: z.array(z.record(z.unknown())).optional(),
  edges: z.array(z.record(z.unknown())).optional(),
})

// GET /api/workflows
workflowRouter.get('/', async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.userId || ''

    if (isDBConnected()) {
      const workflows = await Workflow.find({ userId }).sort({ updatedAt: -1 }).lean()
      const formatted = workflows.map((w: any) => ({
        ...w,
        id: w._id.toString(),
      }))
      return res.json({ workflows: formatted })
    } else {
      const workflows = memoryStore.findWorkflowsByUserId(userId)
      return res.json({ workflows })
    }
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to fetch workflows',
      details: (error as Error).message,
    })
  }
})

// GET /api/workflows/:id
workflowRouter.get('/:id', async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.userId || ''

    if (isDBConnected()) {
      const workflow = await Workflow.findOne({
        _id: req.params.id,
        userId,
      })
      if (!workflow) {
        return res.status(404).json({ error: 'Workflow not found' })
      }
      return res.json({ workflow })
    } else {
      const workflow = memoryStore.findWorkflowById(req.params.id, userId)
      if (!workflow) {
        return res.status(404).json({ error: 'Workflow not found' })
      }
      return res.json({ workflow })
    }
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to retrieve workflow',
      details: (error as Error).message,
    })
  }
})

// POST /api/workflows
workflowRouter.post('/', async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const parseResult = WorkflowCreateSchema.safeParse(req.body)
    if (!parseResult.success) {
      return res.status(400).json({
        error: parseResult.error.errors[0]?.message || 'Validation failed',
      })
    }

    const { title, nodes, edges } = parseResult.data
    const userId = req.user?.userId || ''

    if (isDBConnected()) {
      const newWorkflow = await Workflow.create({
        userId,
        title,
        nodes,
        edges,
      })
      return res.status(201).json({
        message: 'Workflow saved successfully',
        workflow: newWorkflow,
      })
    } else {
      const newWorkflow = memoryStore.createWorkflow({
        userId,
        title,
        nodes,
        edges: edges as any,
      })
      return res.status(201).json({
        message: 'Workflow saved successfully',
        workflow: newWorkflow,
      })
    }
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to create workflow',
      details: (error as Error).message,
    })
  }
})

// PUT /api/workflows/:id
workflowRouter.put('/:id', async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const parseResult = WorkflowUpdateSchema.safeParse(req.body)
    if (!parseResult.success) {
      return res.status(400).json({
        error: parseResult.error.errors[0]?.message || 'Validation failed',
      })
    }

    const userId = req.user?.userId || ''

    if (isDBConnected()) {
      const updated = await Workflow.findOneAndUpdate(
        { _id: req.params.id, userId },
        { $set: parseResult.data },
        { new: true }
      )
      if (!updated) {
        return res.status(404).json({ error: 'Workflow not found' })
      }
      return res.json({ message: 'Workflow updated successfully', workflow: updated })
    } else {
      const updated = memoryStore.updateWorkflow(req.params.id, userId, parseResult.data as any)
      if (!updated) {
        return res.status(404).json({ error: 'Workflow not found' })
      }
      return res.json({ message: 'Workflow updated successfully', workflow: updated })
    }
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to update workflow',
      details: (error as Error).message,
    })
  }
})

// DELETE /api/workflows/:id
workflowRouter.delete('/:id', async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.userId || ''

    if (isDBConnected()) {
      const deleted = await Workflow.findOneAndDelete({
        _id: req.params.id,
        userId,
      })
      if (!deleted) {
        return res.status(404).json({ error: 'Workflow not found' })
      }
      return res.json({ message: 'Workflow deleted successfully' })
    } else {
      const deleted = memoryStore.deleteWorkflow(req.params.id, userId)
      if (!deleted) {
        return res.status(404).json({ error: 'Workflow not found' })
      }
      return res.json({ message: 'Workflow deleted successfully' })
    }
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to delete workflow',
      details: (error as Error).message,
    })
  }
})
