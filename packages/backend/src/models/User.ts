import { Schema, model, Document } from 'mongoose'

export type Role = 'user' | 'admin'

export interface UserDocument extends Document {
  username: string
  passwordHash: string
  role: Role
  createdAt: Date
}

const userSchema = new Schema<UserDocument>({
  username: { type: String, required: true, unique: true, trim: true, lowercase: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  createdAt: { type: Date, default: Date.now },
})

export const User = model<UserDocument>('User', userSchema)
