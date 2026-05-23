import mongoose, { Schema, Document } from "mongoose";

export interface ITienda extends Document {
  userId: string;
  workspaceName?: string;
  name: string;
  businessType: string | null;
  address: string;
  city: string;
  manager: string;
  phone: string;
  status: "active" | "paused" | "opening";
  staff: number;
  monthlyClients: number;
  notes: string;
  isMain: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const tiendaSchema = new Schema<ITienda>(
  {
    userId: { type: String, required: true, index: true },
    workspaceName: { type: String, default: "" },
    name: { type: String, required: true, trim: true },
    businessType: { type: String, default: null },
    address: { type: String, default: "" },
    city: { type: String, default: "" },
    manager: { type: String, default: "" },
    phone: { type: String, default: "" },
    status: {
      type: String,
      enum: ["active", "paused", "opening"],
      default: "opening",
    },
    staff: { type: Number, default: 0, min: 0 },
    monthlyClients: { type: Number, default: 0, min: 0 },
    notes: { type: String, default: "" },
    isMain: { type: Boolean, default: false },
  },
  { timestamps: true }
);

tiendaSchema.index({ userId: 1, isMain: 1 });

export const Tienda = mongoose.model<ITienda>("Tienda", tiendaSchema);
