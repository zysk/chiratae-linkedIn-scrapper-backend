import mongoose, { Document, Model, Schema } from 'mongoose';

// Interface for identifying previously scraped leads
export interface IPreviousLead {
  profileId: string; // LinkedIn profile ID
  campaignId?: mongoose.Types.ObjectId;
  timestamp: Date;
}

export interface IPreviousLeadDocument extends IPreviousLead, Document {}
export interface IPreviousLeadModel extends Model<IPreviousLeadDocument> {}

const PreviousLeadSchema = new Schema<IPreviousLeadDocument, IPreviousLeadModel>(
  {
    profileId: {
      type: String,
      required: true,
      index: true,
      unique: true, // Ensure we only record each profile once
    },
    campaignId: {
      // Optional: Record which campaign first found this lead
      type: Schema.Types.ObjectId,
      ref: 'Campaign',
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    timestamps: false, // Use specific timestamp field
    versionKey: false,
  }
);

const PreviousLead = mongoose.model<IPreviousLeadDocument, IPreviousLeadModel>(
  'PreviousLead',
  PreviousLeadSchema
);

export default PreviousLead;