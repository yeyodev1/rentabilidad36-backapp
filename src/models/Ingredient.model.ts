import mongoose, { Schema, Document } from "mongoose";

export interface IIngredient extends Document {
  companyId: mongoose.Types.ObjectId;
  name: string;
  unitOfMeasure: "kg" | "l" | "unidad";
  costPrice: number;
  wastePercentage: number;
  createdAt: Date;
  updatedAt: Date;
}

const ingredientSchema = new Schema<IIngredient>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    name: { type: String, required: true, trim: true },
    unitOfMeasure: { type: String, enum: ["kg", "l", "unidad"], required: true },
    costPrice: { type: Number, required: true, min: 0 },
    wastePercentage: { type: Number, default: 0, min: 0, max: 100 },
  },
  { timestamps: true }
);

export const Ingredient = mongoose.model<IIngredient>("Ingredient", ingredientSchema);
