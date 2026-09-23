import mongoose, { Schema, Document, Types } from 'mongoose'

export interface IWorkflow extends Document {
  userId: Types.ObjectId | string
  title: string
  nodes: Array<Record<string, unknown>>
  edges: Array<{ id: string; source: string; dest: string; [key: string]: unknown }>
  createdAt: Date
  updatedAt: Date
}

const WorkflowSchema = new Schema<IWorkflow>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      default: 'New Workflow',
      trim: true,
    },
    nodes: {
      type: [Schema.Types.Mixed],
      default: [],
    },
    edges: {
      type: [Schema.Types.Mixed],
      default: [],
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

export const Workflow = mongoose.models.Workflow || mongoose.model<IWorkflow>('Workflow', WorkflowSchema)
