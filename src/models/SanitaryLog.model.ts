import mongoose, { Schema, Document } from "mongoose";

export interface ISanitaryLog extends Document {
  branchId: mongoose.Types.ObjectId;
  date: Date;
  category: "temperaturas" | "trampa_grasa" | "fumigacion" | "filtro_agua" | "limpieza_profunda";
  completed: boolean;
  percentage: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const sanitaryLogSchema = new Schema<ISanitaryLog>(
  {
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true, index: true },
    date: { type: Date, required: true },
    category: {
      type: String,
      enum: ["temperaturas", "trampa_grasa", "fumigacion", "filtro_agua", "limpieza_profunda"],
      required: true,
    },
    completed: { type: Boolean, default: false },
    percentage: { type: Number, min: 0, max: 100 },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

export const SanitaryLog = mongoose.model<ISanitaryLog>("SanitaryLog", sanitaryLogSchema);
