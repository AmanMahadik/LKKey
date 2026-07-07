import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUploadLog extends Document {
  datasetId: mongoose.Types.ObjectId;
  fileName: string;
  rowsInserted: number;
  rowsFailed: number;
  uploadedBy: string;
  createdAt: Date;
}

const UploadLogSchema: Schema = new Schema({
  datasetId: { type: Schema.Types.ObjectId, ref: 'Dataset', required: true, index: true },
  fileName: { type: String, required: true },
  rowsInserted: { type: Number, default: 0 },
  rowsFailed: { type: Number, default: 0 },
  uploadedBy: { type: String, default: 'Admin' },
  createdAt: { type: Date, default: Date.now }
});

export const UploadLog: Model<IUploadLog> = mongoose.models.UploadLog || mongoose.model<IUploadLog>('UploadLog', UploadLogSchema);
