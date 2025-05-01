import mongoose, { Document, Model, Schema } from 'mongoose';
import { ICampaign } from '../interfaces/Campaign.interface';
import { campaignStatusObj } from '../helpers/Constants';

// Interface for Campaign Document (includes Mongoose methods)
export interface ICampaignDocument extends ICampaign, Document {}

// Interface for Campaign Model (static methods)
export interface ICampaignModel extends Model<ICampaignDocument> {}

// Campaign Schema
const CampaignSchema = new Schema<ICampaignDocument, ICampaignModel>(
  {
    name: {
      type: String,
      required: [true, 'Campaign name is required'],
      trim: true,
    },
    searchQuery: {
      type: String,
      required: [true, 'Search query is required'],
      trim: true,
    },
    linkedInAccountId: {
      type: Schema.Types.ObjectId,
      ref: 'LinkedInAccount',
      required: [true, 'LinkedIn account is required'],
    },
    proxyId: {
      type: Schema.Types.ObjectId,
      ref: 'Proxy',
    },
    status: {
      type: String,
      enum: Object.values(campaignStatusObj),
      default: campaignStatusObj.CREATED,
    },
    isSearched: {
      type: Boolean,
      default: false, // Indicates if initial search (URL collection) is done
    },
    processing: {
      type: Boolean,
      default: false, // Indicates if campaign is actively being scraped
    },
    totalResults: {
      type: Number,
      default: 0,
    },
    resultsArr: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Lead',
      },
    ],
    runCount: {
      type: Number,
      default: 0,
    },
    lastRun: {
      type: Date,
    },
    // Filters
    school: {
      type: String,
      trim: true,
    },
    company: {
      type: String,
      trim: true,
    },
    pastCompany: {
      type: String,
      trim: true,
    },
    // Schedule
    schedule: {
      type: String, // Cron pattern
      trim: true,
    },
    isScheduled: {
      type: Boolean,
      default: false,
    },
    // Audit
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes
CampaignSchema.index({ status: 1, isSearched: 1, processing: 1 });
CampaignSchema.index({ createdBy: 1 });

// Campaign Model
const Campaign = mongoose.model<ICampaignDocument, ICampaignModel>(
  'Campaign',
  CampaignSchema
);

export default Campaign;