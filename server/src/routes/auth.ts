import { Router, type Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { User } from '../models/User'
import { isDBConnected } from '../db'
import { memoryStore } from '../memoryStore'
import { requireAuth, JWT_SECRET, type AuthenticatedRequest } from '../middleware/auth'

export const authRouter = Router()

const SignUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().optional(),
})

const SignInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

// POST /api/auth/signup
authRouter.post('/signup', async (req, res): Promise<any> => {
  try {
    const parseResult = SignUpSchema.safeParse(req.body)
    if (!parseResult.success) {
      return res.status(400).json({
        error: parseResult.error.errors[0]?.message || 'Validation failed',
      })
    }

    const { email, password, name } = parseResult.data
    const normalizedEmail = email.toLowerCase()

    if (isDBConnected()) {
      const existingUser = await User.findOne({ email: normalizedEmail })
      if (existingUser) {
        return res.status(409).json({ error: 'An account with this email already exists' })
      }

      const hashedPassword = await bcrypt.hash(password, 10)
      const newUser = await User.create({
        email: normalizedEmail,
        password: hashedPassword,
        name: name?.trim() || email.split('@')[0],
      })

      const token = jwt.sign(
        { userId: newUser._id.toString(), email: newUser.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      )

      return res.status(201).json({
        message: 'User created successfully',
        user: {
          id: newUser._id.toString(),
          email: newUser.email,
          name: newUser.name,
        },
        token,
      })
    } else {
      // Memory Store fallback
      const existingUser = memoryStore.findUserByEmail(normalizedEmail)
      if (existingUser) {
        return res.status(409).json({ error: 'An account with this email already exists' })
      }

      const hashedPassword = await bcrypt.hash(password, 10)
      const newUser = memoryStore.createUser({
        email: normalizedEmail,
        password: hashedPassword,
        name: name?.trim() || email.split('@')[0],
      })

      const token = jwt.sign(
        { userId: newUser.id, email: newUser.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      )

      return res.status(201).json({
        message: 'User created successfully',
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
        },
        token,
      })
    }
  } catch (error) {
    console.error('Sign up error:', error)
    return res.status(500).json({
      error: 'Failed to create account. Please try again.',
      details: (error as Error).message,
    })
  }
})

// POST /api/auth/signin
authRouter.post('/signin', async (req, res): Promise<any> => {
  try {
    const parseResult = SignInSchema.safeParse(req.body)
    if (!parseResult.success) {
      return res.status(400).json({
        error: parseResult.error.errors[0]?.message || 'Validation failed',
      })
    }

    const { email, password } = parseResult.data
    const normalizedEmail = email.toLowerCase()

    let user: { id: string; email: string; password: string; name?: string } | null = null

    if (isDBConnected()) {
      const dbUser = await User.findOne({ email: normalizedEmail })
      if (dbUser) {
        user = {
          id: dbUser._id.toString(),
          email: dbUser.email,
          password: dbUser.password,
          name: dbUser.name,
        }
      }
    } else {
      const memUser = memoryStore.findUserByEmail(normalizedEmail)
      if (memUser) {
        user = memUser
      }
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    return res.json({
      message: 'Sign in successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
    })
  } catch (error) {
    console.error('Sign in error:', error)
    return res.status(500).json({
      error: 'Failed to sign in. Please try again.',
      details: (error as Error).message,
    })
  }
})

// GET /api/auth/me
authRouter.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.userId || ''

    if (isDBConnected()) {
      const user = await User.findById(userId).select('-password')
      if (!user) {
        return res.status(404).json({ error: 'User not found' })
      }
      return res.json({
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
        },
      })
    } else {
      const user = memoryStore.findUserById(userId)
      if (!user) {
        return res.status(404).json({ error: 'User not found' })
      }
      return res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
        },
      })
    }
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to fetch current user profile',
      details: (error as Error).message,
    })
  }
})
