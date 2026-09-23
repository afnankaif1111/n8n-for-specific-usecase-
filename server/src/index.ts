import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { connectDB } from './db'
import { authRouter } from './routes/auth'
import { workflowRouter } from './routes/workflows'
import { credentialRouter } from './routes/credentials'
import { nodeRouter } from './routes/nodes'
import { executionRouter } from './routes/executions'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json({ limit: '10mb' }))

// Health Check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'workflow-builder-backend',
    database: 'mongodb',
  })
})

// Mount API Routes
app.use('/api/auth', authRouter)
app.use('/api/workflows', workflowRouter)
app.use('/api/credentials', credentialRouter)
app.use('/api/nodes', nodeRouter)
app.use('/api/executions', executionRouter)

// 404 Handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Endpoint not found' })
})

// Start server
async function startServer() {
  await connectDB()

  app.listen(PORT, () => {
    console.log(`[Server] Workflow Builder Backend running at http://localhost:${PORT}`)
    console.log(`[Server] API Health check available at http://localhost:${PORT}/api/health`)
  })
}

// Start if executed directly
if (process.env.NODE_ENV !== 'test' && !process.env.TEST_RUN) {
  startServer()
}

export default app
