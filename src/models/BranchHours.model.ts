import mongoose, { Schema, Document } from "mongoose";

export interface IBranchHours extends Document {
  branchId: mongoose.Types.ObjectId;
  dayOfWeek: number;
  area: "cocina" | "atencion";
  openTime: string;
  closeTime: string;
  isActive: boolean;
}

const branchHoursSchema = new Schema<IBranchHours>(
  {
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true, index: true },
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
    area: { type: String, enum: ["cocina", "atencion"], required: true },
    openTime: { type: String, required: true },
    closeTime: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

branchHoursSchema.index({ branchId: 1, dayOfWeek: 1, area: 1 });

export const BranchHours = mongoose.model<IBranchHours>("BranchHours", branchHoursSchema);
