import mongoose, { Schema, Document } from "mongoose";

export interface IPOSConnection extends Document {
  companyId: mongoose.Types.ObjectId;
  provider: string;
  status?: string;
  apiKey?: string;
  storeId?: string;
  settings?: { apiKey: string; storeId: string };
  createdAt: Date;
  updatedAt: Date;
}

const posConnectionSchema = new Schema<IPOSConnection>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    provider: { type: String, required: true, trim: true },
    status: { type: String, default: "active" },
    apiKey: { type: String },
    storeId: { type: String },
    settings: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export const POSConnection = mongoose.model<IPOSConnection>("POSConnection", posConnectionSchema);
