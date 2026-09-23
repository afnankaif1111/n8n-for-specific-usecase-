import mongoose, { Schema, Document, Types } from 'mongoose'

export interface IExecution extends Document {
  workflowId: Types.ObjectId | string
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED'
  log: Array<string | Record<string, unknown>> | string
  startTime: Date
  endTime?: Date
  createdAt: Date
  updatedAt: Date
}

const ExecutionSchema = new Schema<IExecution>(
  {
    workflowId: {
      type: Schema.Types.ObjectId,
      ref: 'Workflow',
      required: true,
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['PENDING', 'RUNNING', 'SUCCESS', 'FAILED'],
      default: 'PENDING',
      index: true,
    },
    log: {
      type: Schema.Types.Mixed,
      default: [],
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret) => {
        ret.id = ret._id
        delete ret.__v
        return ret
      },
    },
  }
)

export const Execution =
  mongoose.models.Execution ||
  mongoose.model<IExecution>('Execution', ExecutionSchema)
