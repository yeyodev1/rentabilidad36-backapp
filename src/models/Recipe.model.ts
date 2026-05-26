import mongoose, { Schema, Document } from "mongoose";

interface IRecipeIngredient {
  ingredientId: mongoose.Types.ObjectId;
  quantity: number;
}

export interface IRecipe extends Document {
  companyId: mongoose.Types.ObjectId;
  name: string;
  sellingPrice: number;
  ingredients: IRecipeIngredient[];
  wastePercentage: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const recipeSchema = new Schema<IRecipe>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    name: { type: String, required: true, trim: true },
    sellingPrice: { type: Number, required: true, min: 0 },
    ingredients: [
      {
        ingredientId: { type: Schema.Types.ObjectId, ref: "Ingredient", required: true },
        quantity: { type: Number, required: true },
      },
    ],
    wastePercentage: { type: Number, default: 0, min: 0, max: 100 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Recipe = mongoose.model<IRecipe>("Recipe", recipeSchema);
