import mongoose, { Schema, Document } from "mongoose";

export interface IBranch extends Document {
  companyId: mongoose.Types.ObjectId;
  name: string;
  address?: string;
  phone?: string;
  isMain: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const branchSchema = new Schema<IBranch>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    name: { type: String, required: true, trim: true },
    address: { type: String, trim: true },
    phone: { type: String, trim: true },
    isMain: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

branchSchema.index({ companyId: 1, isMain: 1 });

export const Branch = mongoose.model<IBranch>("Branch", branchSchema);
