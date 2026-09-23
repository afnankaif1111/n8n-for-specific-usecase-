import mongoose, { Schema, Document, Types } from 'mongoose'

export interface ICredential extends Document {
  userId: Types.ObjectId | string
  title: string
  type: string // e.g. 'lighter', 'hyperliquid', 'backpack'
  credentialType: string // e.g. 'api_key_secret', 'private_key'
  data: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

const CredentialSchema = new Schema<ICredential>(
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
      trim: true,
    },
    type: {
      type: String,
      required: true,
      trim: true,
    },
    credentialType: {
      type: String,
      required: true,
      trim: true,
    },
    data: {
      type: Schema.Types.Mixed,
      required: true,
      default: {},
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

export const Credential = mongoose.models.Credential || mongoose.model<ICredential>('Credential', CredentialSchema)
