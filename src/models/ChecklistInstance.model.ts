import mongoose, { Schema, Document } from "mongoose";

export interface IChecklistInstance extends Document {
  companyId: mongoose.Types.ObjectId;
  branchId: mongoose.Types.ObjectId;
  templateId: mongoose.Types.ObjectId;
  operatorId: mongoose.Types.ObjectId;
  operatorName?: string;
  responses: Record<string, unknown>;
  status: "pending" | "reviewed" | "approved";
  reviewerId?: mongoose.Types.ObjectId;
  reviewerName?: string;
  reviewerComments?: string;
  approvedAt?: Date;
  photoUrl?: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const checklistInstanceSchema = new Schema<IChecklistInstance>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true },
    templateId: { type: Schema.Types.ObjectId, ref: "ChecklistTemplate", required: true },
    operatorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    operatorName: { type: String, trim: true },
    responses: { type: Schema.Types.Mixed, default: {} },
    status: {
      type: String,
      enum: ["pending", "reviewed", "approved"],
      default: "pending",
    },
    reviewerId: { type: Schema.Types.ObjectId, ref: "User" },
    reviewerName: { type: String, trim: true },
    reviewerComments: { type: String, trim: true },
    approvedAt: { type: Date },
    photoUrl: { type: String },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const ChecklistInstance = mongoose.model<IChecklistInstance>("ChecklistInstance", checklistInstanceSchema);
