import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDataset extends Document {
  slug: string;
  name: string;
  description?: string;
  schemaFields: string[];       // Expected columns, e.g. ["state", "city", "rto_code"]
  searchableFields: string[];   // Fields where fuzzy matching applies, e.g. ["city", "state"]
  uniqueKeys: string[];         // Key combinations that prevent duplicate records, e.g. ["state", "city"]
  createdAt: Date;
}

const DatasetSchema: Schema = new Schema({
  slug: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  description: { type: String },
  schemaFields: { type: [String], required: true },
  searchableFields: { type: [String], required: true },
  uniqueKeys: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now }
});

// To handle model compilation issues during Hot Module Replacement (HMR)
export const Dataset: Model<IDataset> = mongoose.models.Dataset || mongoose.model<IDataset>('Dataset', DatasetSchema);
