import { Response } from "express";
import { AuthRequest } from "../types/AuthRequest";
import { Ingredient } from "../models/Ingredient.model";
import { Recipe } from "../models/Recipe.model";
import { Company } from "../models/Company.model";

async function resolveCompanyId(userId: string, queryCompanyId?: string): Promise<string | null> {
  if (queryCompanyId) return queryCompanyId;
  const company = await Company.findOne({ userId });
  return company ? company._id.toString() : null;
}

// --- Ingredients ---

export async function listIngredients(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const companyId = await resolveCompanyId(userId);
    if (!companyId) return res.status(400).json({ message: "No company found" });

    const ingredients = await Ingredient.find({ companyId }).sort({ name: 1 });
    res.json(ingredients);
  } catch (error: any) {
    res.status(500).json({ message: "Error listing ingredients", error: error.message });
  }
}

export async function createIngredient(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const companyId = await resolveCompanyId(userId);
    if (!companyId) return res.status(400).json({ message: "No company found" });

    const { name, unitOfMeasure, costPrice, wastePercentage } = req.body;

    if (!name || !unitOfMeasure || costPrice == null) {
      return res.status(400).json({ message: "name, unitOfMeasure, and costPrice are required" });
    }

    const ingredient = await Ingredient.create({
      companyId,
      name,
      unitOfMeasure,
      costPrice,
      wastePercentage: wastePercentage || 0,
    });

    res.status(201).json(ingredient);
  } catch (error: any) {
    res.status(500).json({ message: "Error creating ingredient", error: error.message });
  }
}

export async function deleteIngredient(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { id } = req.params;
    const ingredient = await Ingredient.findById(id);
    if (!ingredient) return res.status(404).json({ message: "Ingredient not found" });

    const companyId = await resolveCompanyId(userId);
    if (companyId && ingredient.companyId.toString() !== companyId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await Ingredient.findByIdAndDelete(id);
    res.json({ message: "Ingredient deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ message: "Error deleting ingredient", error: error.message });
  }
}

// --- Recipes ---

export async function listRecipes(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const companyId = await resolveCompanyId(userId);
    if (!companyId) return res.status(400).json({ message: "No company found" });

    const recipes = await Recipe.find({ companyId }).populate("ingredients.ingredientId").sort({ name: 1 });
    res.json(recipes);
  } catch (error: any) {
    res.status(500).json({ message: "Error listing recipes", error: error.message });
  }
}

export async function createRecipe(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const companyId = await resolveCompanyId(userId);
    if (!companyId) return res.status(400).json({ message: "No company found" });

    const { name, sellingPrice, ingredients, wastePercentage, isActive } = req.body;

    if (!name || sellingPrice == null || !Array.isArray(ingredients)) {
      return res.status(400).json({ message: "name, sellingPrice, and ingredients array are required" });
    }

    const recipe = await Recipe.create({
      companyId,
      name,
      sellingPrice,
      ingredients,
      wastePercentage: wastePercentage || 0,
      isActive: isActive !== false,
    });

    res.status(201).json(recipe);
  } catch (error: any) {
    res.status(500).json({ message: "Error creating recipe", error: error.message });
  }
}

export async function deleteRecipe(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { id } = req.params;
    const recipe = await Recipe.findById(id);
    if (!recipe) return res.status(404).json({ message: "Recipe not found" });

    const companyId = await resolveCompanyId(userId);
    if (companyId && recipe.companyId.toString() !== companyId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await Recipe.findByIdAndDelete(id);
    res.json({ message: "Recipe deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ message: "Error deleting recipe", error: error.message });
  }
}
