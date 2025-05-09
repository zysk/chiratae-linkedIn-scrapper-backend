import mongoose, { Document, Schema } from 'mongoose';
import { leadStatuses } from '../utils/constants';

/**
 * Lead interface
 * Acts as a link between a Campaign and a scraped profile
 */
export enum LeadProcessingStatus {
  PENDING = 'pending',
  QUEUED = 'queued',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export interface ILead extends Document {
  campaignId: mongoose.Types.ObjectId;
  clientId: string; // LinkedIn profile ID
  leadAssignedToId?: mongoose.Types.ObjectId;
  status: string;
  rating?: string;
  isSearched: boolean;
  link?: string; // LinkedIn profile URL
  name?: string;
  headline?: string;
  location?: string;
  summary?: string;
  imageUrl?: string;
  connections?: string;
  createdAt: Date;
  updatedAt: Date;
  processingStatus?: LeadProcessingStatus;
  lastProcessingAttempt?: Date;
  processingErrors?: string[];
  processingAttempts?: number;
}

/**
 * Lead Schema
 */
const leadSchema = new Schema<ILead>(
  {
    campaignId: {
      type: Schema.Types.ObjectId,
      ref: 'Campaign',
      required: [true, 'Campaign ID is required']
    },
    clientId: {
      type: String,
      required: [true, 'Client ID (LinkedIn profile ID) is required'],
      trim: true
    },
    leadAssignedToId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: Object.values(leadStatuses),
      default: leadStatuses.NEW
    },
    rating: {
      type: String
    },
    isSearched: {
      type: Boolean,
      default: false
    },
    link: {
      type: String,
      trim: true
    },
    name: {
      type: String,
      trim: true
    },
    headline: {
      type: String,
      trim: true
    },
    location: {
      type: String,
      trim: true
    },
    summary: {
      type: String,
      trim: true
    },
    imageUrl: {
      type: String,
      trim: true
    },
    connections: {
      type: String,
      trim: true
    },
    processingStatus: {
      type: String,
      enum: Object.values(LeadProcessingStatus),
      default: LeadProcessingStatus.PENDING
    },
    lastProcessingAttempt: {
      type: Date
    },
    processingErrors: {
      type: [String],
      default: []
    },
    processingAttempts: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Add indexes for faster queries
leadSchema.index({ campaignId: 1 });
leadSchema.index({ clientId: 1 });
leadSchema.index({ leadAssignedToId: 1 });
leadSchema.index({ status: 1 });
leadSchema.index({ campaignId: 1, clientId: 1 }, { unique: true });

const Lead = mongoose.model<ILead>('Lead', leadSchema);

export default Lead;
