import mongoose, { Schema, Document } from "mongoose";

export interface IFixedCost extends Document {
  companyId: mongoose.Types.ObjectId;
  rent: number;
  payroll: number;
  utilities: number;
  insurance: number;
  marketing: number;
  other: number;
  effectiveDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const fixedCostSchema = new Schema<IFixedCost>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    rent: { type: Number, default: 0, min: 0 },
    payroll: { type: Number, default: 0, min: 0 },
    utilities: { type: Number, default: 0, min: 0 },
    insurance: { type: Number, default: 0, min: 0 },
    marketing: { type: Number, default: 0, min: 0 },
    other: { type: Number, default: 0, min: 0 },
    effectiveDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const FixedCost = mongoose.model<IFixedCost>("FixedCost", fixedCostSchema);
