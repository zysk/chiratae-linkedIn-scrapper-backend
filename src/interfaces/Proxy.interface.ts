import mongoose from "mongoose";

export interface IProxy {
  value: string; // e.g., http://user:pass@host:port or host:port
  // Status/tracking fields
  isValid?: boolean;
  lastUsed?: Date;
  usageCount?: number;
  // Audit
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
}
