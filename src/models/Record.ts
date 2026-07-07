import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRecord extends Document {
  datasetId: mongoose.Types.ObjectId;
  data: Record<string, any>;
  createdAt: Date;
}

const RecordSchema: Schema = new Schema({
  datasetId: { type: Schema.Types.ObjectId, ref: 'Dataset', required: true, index: true },
  data: { type: Schema.Types.Map, of: Schema.Types.Mixed, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Compound index for fast lookup/filtering by dataset and fields
RecordSchema.index({ datasetId: 1 });

export const RecordModel: Model<IRecord> = mongoose.models.Record || mongoose.model<IRecord>('Record', RecordSchema);
