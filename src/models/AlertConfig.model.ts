import mongoose, { Schema, Document } from "mongoose";

export interface IAlertConfig extends Document {
  companyId: mongoose.Types.ObjectId;
  whatsappEnabled: boolean;
  emailEnabled: boolean;
  pushEnabled: boolean;
  checklistAlerts: boolean;
  marginAlerts: boolean;
  maintenanceAlerts: boolean;
  whatsappNumber?: string;
  emailAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}

const alertConfigSchema = new Schema<IAlertConfig>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, unique: true },
    whatsappEnabled: { type: Boolean, default: false },
    emailEnabled: { type: Boolean, default: false },
    pushEnabled: { type: Boolean, default: false },
    checklistAlerts: { type: Boolean, default: true },
    marginAlerts: { type: Boolean, default: true },
    maintenanceAlerts: { type: Boolean, default: true },
    whatsappNumber: { type: String, trim: true },
    emailAddress: { type: String, trim: true },
  },
  { timestamps: true }
);

export const AlertConfig = mongoose.model<IAlertConfig>("AlertConfig", alertConfigSchema);
