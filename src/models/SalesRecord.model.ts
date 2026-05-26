import mongoose, { Schema, Document } from "mongoose";

export interface ISalesRecord extends Document {
  branchId: mongoose.Types.ObjectId;
  transactionId?: string;
  amount: number;
  items: number;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const salesRecordSchema = new Schema<ISalesRecord>(
  {
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true, index: true },
    transactionId: { type: String, trim: true },
    amount: { type: Number, required: true, min: 0 },
    items: { type: Number, default: 1, min: 1 },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

salesRecordSchema.index({ branchId: 1, timestamp: 1 });

export const SalesRecord = mongoose.model<ISalesRecord>("SalesRecord", salesRecordSchema);
