import mongoose, { Schema, Document } from 'mongoose'

export interface INodeDefinition extends Document {
  nodeId: string
  title: string
  desc: string
  type: 'trigger' | 'action' | 'condition' | 'notification' | string
  credentialType?: string
  category?: string
  createdAt: Date
  updatedAt: Date
}

const NodeDefinitionSchema = new Schema<INodeDefinition>(
  {
    nodeId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    desc: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['trigger', 'action', 'condition', 'notification'],
      index: true,
    },
    credentialType: {
      type: String,
      default: null,
      trim: true,
    },
    category: {
      type: String,
      default: 'General',
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret) => {
        ret.id = ret.nodeId || ret._id
        delete ret.__v
        return ret
      },
    },
  }
)

export const NodeDefinition =
  mongoose.models.NodeDefinition ||
  mongoose.model<INodeDefinition>('NodeDefinition', NodeDefinitionSchema)
