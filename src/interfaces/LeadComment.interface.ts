import mongoose from "mongoose";

export interface ILeadComment {
  leadId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  comment: string;
  // Audit
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
}
