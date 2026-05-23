import mongoose, { Schema, Document } from "mongoose";

export interface IAnalysis extends Document {
  userId?: string;
  projectName: string;
  businessType: string;
  currency: string;
  investment: number;
  avgPrice: number;
  monthlyClients: number;
  rawMaterialPercent: number;
  monthlyRent: number;
  results: {
    monthlySales: number;
    variableCost: number;
    fixedCost: number;
    ebitda: number;
    profitMargin: number;
    breakEvenClients: number;
    healthStatus: string;
    diagnosis: string;
  };
  createdAt: Date;
}

const analysisSchema = new Schema<IAnalysis>(
  {
    userId: { type: String, index: true, sparse: true },
    projectName: { type: String, required: true },
    businessType: { type: String, required: true },
    currency: { type: String, default: "USD" },
    investment: { type: Number, default: 0 },
    avgPrice: { type: Number, required: true },
    monthlyClients: { type: Number, required: true },
    rawMaterialPercent: { type: Number, required: true },
    monthlyRent: { type: Number, required: true },
    results: {
      monthlySales: { type: Number, required: true },
      variableCost: { type: Number, required: true },
      fixedCost: { type: Number, required: true },
      ebitda: { type: Number, required: true },
      profitMargin: { type: Number, required: true },
      breakEvenClients: { type: Number, required: true },
      healthStatus: { type: String, enum: ["green", "yellow", "red"], required: true },
      diagnosis: { type: String, required: true },
    },
  },
  { timestamps: true }
);

export const Analysis = mongoose.model<IAnalysis>("Analysis", analysisSchema);
