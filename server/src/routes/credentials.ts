import { Router, type Response } from 'express'
import { z } from 'zod'
import { Credential } from '../models/Credential'
import { isDBConnected } from '../db'
import { memoryStore } from '../memoryStore'
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth'

export const credentialRouter = Router()

credentialRouter.use(requireAuth)

const CredentialCreateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  type: z.string().min(1, 'Type is required (e.g. lighter, hyperliquid, backpack)'),
  credentialType: z.string().min(1, 'Credential type is required (e.g. api_key_secret, private_key)'),
  data: z.record(z.unknown()).default({}),
})

function maskSecretData(data: Record<string, unknown> = {}): Record<string, unknown> {
  const masked: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string' && value.length > 6) {
      masked[key] = `${value.slice(0, 3)}••••••••${value.slice(-3)}`
    } else {
      masked[key] = '••••••••'
    }
  }
  return masked
}

// GET /api/credentials
credentialRouter.get('/', async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.userId || ''

    if (isDBConnected()) {
      const credentials = await Credential.find({ userId }).sort({ createdAt: -1 }).lean()
      const safeCredentials = credentials.map((cred: any) => ({
        id: cred._id.toString(),
        userId: cred.userId,
        title: cred.title,
        type: cred.type,
        credentialType: cred.credentialType,
        data: maskSecretData(cred.data),
        createdAt: cred.createdAt,
        updatedAt: cred.updatedAt,
      }))
      return res.json({ credentials: safeCredentials })
    } else {
      const credentials = memoryStore.findCredentialsByUserId(userId)
      const safeCredentials = credentials.map((cred) => ({
        ...cred,
        data: maskSecretData(cred.data),
      }))
      return res.json({ credentials: safeCredentials })
    }
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to fetch credentials',
      details: (error as Error).message,
    })
  }
})

// POST /api/credentials
credentialRouter.post('/', async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const parseResult = CredentialCreateSchema.safeParse(req.body)
    if (!parseResult.success) {
      return res.status(400).json({
        error: parseResult.error.errors[0]?.message || 'Validation failed',
      })
    }

    const { title, type, credentialType, data } = parseResult.data
    const userId = req.user?.userId || ''

    if (isDBConnected()) {
      const newCredential = await Credential.create({
        userId,
        title,
        type: type.toLowerCase(),
        credentialType,
        data,
      })
      return res.status(201).json({
        message: 'Credential saved successfully',
        credential: {
          id: newCredential._id.toString(),
          title: newCredential.title,
          type: newCredential.type,
          credentialType: newCredential.credentialType,
          createdAt: newCredential.createdAt,
        },
      })
    } else {
      const newCredential = memoryStore.createCredential({
        userId,
        title,
        type: type.toLowerCase(),
        credentialType,
        data,
      })
      return res.status(201).json({
        message: 'Credential saved successfully',
        credential: {
          id: newCredential.id,
          title: newCredential.title,
          type: newCredential.type,
          credentialType: newCredential.credentialType,
          createdAt: newCredential.createdAt,
        },
      })
    }
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to save credential',
      details: (error as Error).message,
    })
  }
})

// DELETE /api/credentials/:id
credentialRouter.delete('/:id', async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.userId || ''

    if (isDBConnected()) {
      const deleted = await Credential.findOneAndDelete({
        _id: req.params.id,
        userId,
      })
      if (!deleted) {
        return res.status(404).json({ error: 'Credential not found' })
      }
      return res.json({ message: 'Credential deleted successfully' })
    } else {
      const deleted = memoryStore.deleteCredential(req.params.id, userId)
      if (!deleted) {
        return res.status(404).json({ error: 'Credential not found' })
      }
      return res.json({ message: 'Credential deleted successfully' })
    }
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to delete credential',
      details: (error as Error).message,
    })
  }
})
