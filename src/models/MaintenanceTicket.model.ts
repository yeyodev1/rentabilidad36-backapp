import mongoose, { Schema, Document } from "mongoose";

export interface IMaintenanceTicket extends Document {
  equipmentId: mongoose.Types.ObjectId;
  branchId: mongoose.Types.ObjectId;
  reportedBy: mongoose.Types.ObjectId;
  title?: string;
  description: string;
  status: "abierto" | "en_progreso" | "resuelto" | "cerrado";
  assignedTo?: string;
  priority: "baja" | "media" | "alta" | "critica";
  resolvedAt?: Date;
  resolutionNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const maintenanceTicketSchema = new Schema<IMaintenanceTicket>(
  {
    equipmentId: { type: Schema.Types.ObjectId, ref: "Equipment", required: true, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true },
    reportedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, trim: true },
    description: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["abierto", "en_progreso", "resuelto", "cerrado"],
      default: "abierto",
    },
    assignedTo: { type: String, trim: true },
    priority: {
      type: String,
      enum: ["baja", "media", "alta", "critica"],
      default: "media",
    },
    resolvedAt: { type: Date },
    resolutionNotes: { type: String, trim: true },
  },
  { timestamps: true }
);

export const MaintenanceTicket = mongoose.model<IMaintenanceTicket>("MaintenanceTicket", maintenanceTicketSchema);
