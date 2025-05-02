import mongoose, { Document, Model, Schema } from "mongoose";
import { ILeadStatusDef } from "../interfaces/LeadStatusDef.interface";

// Interface for LeadStatusDef Document
export interface ILeadStatusDefDocument extends ILeadStatusDef, Document {}

// Interface for LeadStatusDef Model
export interface ILeadStatusDefModel extends Model<ILeadStatusDefDocument> {}

// LeadStatusDef Schema
const LeadStatusDefSchema = new Schema<
  ILeadStatusDefDocument,
  ILeadStatusDefModel
>(
  {
    name: {
      type: String,
      required: [true, "Status name is required"],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    color: {
      type: String, // e.g., hex code #RRGGBB
      trim: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
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
LeadStatusDefSchema.index({ name: 1 });

// LeadStatusDef Model
const LeadStatusDef = mongoose.model<
  ILeadStatusDefDocument,
  ILeadStatusDefModel
>("LeadStatusDef", LeadStatusDefSchema);

export default LeadStatusDef;
