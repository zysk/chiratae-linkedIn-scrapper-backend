import mongoose, { Document, Model, Schema } from "mongoose";
import { ILeadComment } from "../interfaces/LeadComment.interface";

// Interface for LeadComment Document
export interface ILeadCommentDocument extends ILeadComment, Document {}

// Interface for LeadComment Model
export interface ILeadCommentModel extends Model<ILeadCommentDocument> {}

// LeadComment Schema
const LeadCommentSchema = new Schema<ILeadCommentDocument, ILeadCommentModel>(
  {
    leadId: {
      type: Schema.Types.ObjectId,
      ref: "Lead",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    comment: {
      type: String,
      required: [true, "Comment text is required"],
      trim: true,
    },
    // Audit
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Indexes
LeadCommentSchema.index({ leadId: 1, createdAt: -1 });

// LeadComment Model
const LeadComment = mongoose.model<ILeadCommentDocument, ILeadCommentModel>(
  "LeadComment",
  LeadCommentSchema,
);

export default LeadComment;
