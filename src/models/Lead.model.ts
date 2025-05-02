import mongoose, { Document, Model, Schema } from "mongoose";
import { ILead } from "../interfaces/Lead.interface";
import { leadStatusObj, ratingObj } from "../helpers/Constants";

// Interface for Lead Document
export interface ILeadDocument extends ILead, Document {}

// Interface for Lead Model
export interface ILeadModel extends Model<ILeadDocument> {
  // Add static methods if needed
  findByClientId(clientId: string): Promise<ILeadDocument | null>;
}

// Define schema for nested Profile Data
const ProfileDataSchema = new Schema(
  {
    name: { type: String, trim: true },
    title: { type: String, trim: true },
    location: { type: String, trim: true },
    profilePicture: { type: String, trim: true },
    about: { type: String, trim: true },
    experience: [
      {
        company: { type: String, trim: true },
        title: { type: String, trim: true },
        duration: { type: String, trim: true },
        description: { type: String, trim: true },
        _id: false,
      },
    ],
    education: [
      {
        school: { type: String, trim: true },
        degree: { type: String, trim: true },
        dates: { type: String, trim: true },
        _id: false,
      },
    ],
    skills: [{ type: String, trim: true }],
    contactInfo: { type: Schema.Types.Mixed }, // Use Mixed for potentially varied structure
  },
  { _id: false },
);

// Lead Schema
const LeadSchema = new Schema<ILeadDocument, ILeadModel>(
  {
    clientId: {
      type: String, // LinkedIn profile ID/URL
      required: true,
      unique: true,
      index: true,
    },
    campaignId: {
      type: Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
    },
    leadAssignedToId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: Object.values(leadStatusObj),
      default: leadStatusObj.CREATED,
    },
    isSearched: {
      type: Boolean,
      default: false, // Flag for profile scraping status
    },
    rating: {
      type: String,
      enum: Object.values(ratingObj),
      default: ratingObj.MEDIUM,
    },
    profileData: ProfileDataSchema, // Embed the profile data
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
LeadSchema.index({ campaignId: 1 });
LeadSchema.index({ leadAssignedToId: 1 });
LeadSchema.index({ status: 1, isSearched: 1 });

// Static method example
LeadSchema.statics.findByClientId = function (
  this: ILeadModel,
  clientId: string,
): Promise<ILeadDocument | null> {
  return this.findOne({ clientId }).exec();
};

// Lead Model
const Lead = mongoose.model<ILeadDocument, ILeadModel>("Lead", LeadSchema);

export default Lead;
