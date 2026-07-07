import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IApiKey extends Document {
  keyId: string;                 // Extracted key prefix for direct lookup (e.g. lk_key_abc123)
  keyHash: string;               // Bcrypt hash of the secret portion
  ownerLabel: string;            // Name of the client application/owner
  allowedDatasets: string[];     // Array of allowed dataset slugs, or ["*"] for all
  requestCount: number;
  lastUsedAt?: Date;
  isActive: boolean;
  createdAt: Date;
}

const ApiKeySchema: Schema = new Schema({
  keyId: { type: String, required: true, unique: true, index: true },
  keyHash: { type: String, required: true },
  ownerLabel: { type: String, required: true },
  allowedDatasets: { type: [String], required: true },
  requestCount: { type: Number, default: 0 },
  lastUsedAt: { type: Date },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

export const ApiKey: Model<IApiKey> = mongoose.models.ApiKey || mongoose.model<IApiKey>('ApiKey', ApiKeySchema);
