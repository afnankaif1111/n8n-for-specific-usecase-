import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

export const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/workflow_db'

export function isDBConnected(): boolean {
  return mongoose.connection.readyState === 1
}

export async function connectDB(): Promise<boolean> {
  try {
    if (mongoose.connection.readyState >= 1) {
      return true
    }

    mongoose.set('strictQuery', false)
    mongoose.set('bufferCommands', false) // Avoid 10s buffer timeout if MongoDB is offline

    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 2000,
    })
    console.log(`[MongoDB] Connected successfully to ${MONGODB_URI}`)
    return true
  } catch (error) {
    console.warn(`[MongoDB] Local connection offline: ${(error as Error).message}`)
    console.warn(`[MongoDB] Running in high-performance in-memory fallback mode. Configure MONGODB_URI in .env to connect to MongoDB Atlas.`)
    return false
  }
}

mongoose.connection.on('disconnected', () => {
  console.log('[MongoDB] Disconnected')
})

mongoose.connection.on('error', (err) => {
  // Avoid unhandled crash if local mongo is down
  console.warn('[MongoDB] Connection event notice:', err.message)
})
