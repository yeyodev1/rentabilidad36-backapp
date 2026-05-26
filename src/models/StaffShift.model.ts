import mongoose, { Schema, Document } from "mongoose";

export interface IStaffShift extends Document {
  branchId: mongoose.Types.ObjectId;
  area: "cocina" | "atencion";
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  staffCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const staffShiftSchema = new Schema<IStaffShift>(
  {
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true, index: true },
    area: { type: String, enum: ["cocina", "atencion"], required: true },
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    staffCount: { type: Number, required: true, min: 1 },
  },
  { timestamps: true }
);

export const StaffShift = mongoose.model<IStaffShift>("StaffShift", staffShiftSchema);
