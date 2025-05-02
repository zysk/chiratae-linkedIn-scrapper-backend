import mongoose from "mongoose";

export interface ILeadStatusDef {
  name: string;
  description?: string;
  color?: string; // e.g., hex code for UI display
  isDefault?: boolean;
  // Audit
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
}
