import mongoose, { Schema, Document } from "mongoose";

export interface IPOSConnection extends Document {
  branchId: mongoose.Types.ObjectId;
  provider: string;
  apiKey?: string;
  webhookUrl?: string;
  isActive: boolean;
  lastSyncAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const posConnectionSchema = new Schema<IPOSConnection>(
  {
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true, unique: true, index: true },
    provider: { type: String, required: true, trim: true },
    apiKey: { type: String },
    webhookUrl: { type: String, trim: true },
    isActive: { type: Boolean, default: false },
    lastSyncAt: { type: Date },
  },
  { timestamps: true }
);

export const POSConnection = mongoose.model<IPOSConnection>("POSConnection", posConnectionSchema);
