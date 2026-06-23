import mongoose, { Schema, Document } from "mongoose";

export interface IEquipment extends Document {
  branchId: mongoose.Types.ObjectId;
  name: string;
  brand?: string;
  purchaseDate: Date;
  historicalCost: number;
  usefulLife: number;
  maintenanceIntervalDays: number;
  lastMaintenanceDate?: Date;
  status: "operativo" | "averiado" | "mantenimiento" | "fuera_servicio";
  location?: string;
  qrCode?: string;
  imageUrl?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const equipmentSchema = new Schema<IEquipment>(
  {
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true, index: true },
    name: { type: String, required: true, trim: true },
    brand: { type: String, trim: true },
    purchaseDate: { type: Date, required: true },
    historicalCost: { type: Number, required: true, min: 0 },
    usefulLife: { type: Number, required: true, min: 1 },
    maintenanceIntervalDays: { type: Number, required: true, min: 1 },
    lastMaintenanceDate: { type: Date },
    status: {
      type: String,
      enum: ["operativo", "averiado", "mantenimiento", "fuera_servicio"],
      default: "operativo",
    },
    location: { type: String, trim: true },
    qrCode: { type: String },
    imageUrl: { type: String },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

export const Equipment = mongoose.model<IEquipment>("Equipment", equipmentSchema);
