import mongoose, { Schema, Document } from "mongoose";

interface IChecklistField {
  label: string;
  type: "checkbox" | "slider" | "text" | "number" | "photo";
  required: boolean;
  order: number;
}

export interface IChecklistTemplate extends Document {
  companyId: mongoose.Types.ObjectId;
  name: string;
  category: "cocina_insumos" | "atencion_planta" | "caja_finanzas";
  description?: string;
  fields: IChecklistField[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const checklistTemplateSchema = new Schema<IChecklistTemplate>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ["cocina_insumos", "atencion_planta", "caja_finanzas"],
      required: true,
    },
    description: { type: String, trim: true },
    fields: [
      {
        label: { type: String, required: true },
        type: {
          type: String,
          enum: ["checkbox", "slider", "text", "number", "photo"],
          required: true,
        },
        required: { type: Boolean, default: false },
        order: { type: Number, required: true },
      },
    ],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const ChecklistTemplate = mongoose.model<IChecklistTemplate>("ChecklistTemplate", checklistTemplateSchema);
