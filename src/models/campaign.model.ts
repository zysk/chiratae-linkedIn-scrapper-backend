import mongoose, { Document, Schema, Model } from 'mongoose';

/**
 * Campaign status enum
 */
export enum CampaignStatus {
  CREATED = 'CREATED',
  QUEUED = 'QUEUED',
  RUNNING = 'RUNNING',
  SEARCH_COMPLETED = 'SEARCH_COMPLETED',
  FAILED = 'FAILED',
  PAUSED = 'PAUSED'
}

/**
 * Campaign priority enum
 */
export enum CampaignPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

/**
 * Campaign recurrence enum
 */
export enum CampaignRecurrence {
  ONCE = 'once',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly'
}

/**
 * Campaign result interface - represents a scraped LinkedIn profile
 */
export interface ICampaignResult {
  profileId: string;
  profileUrl?: string;
  name?: string;
  scrapeStatus?: string;
  scraped?: boolean;
  createdAt?: Date;
}

/**
 * Campaign interface
 */
export interface ICampaign extends Document {
  name: string;
  searchQuery: string;
  school?: string;
  company?: string;
  pastCompany?: string;
  location?: string;
  industry?: string;
  connectionDegree?: string;
  keywords?: string[];
  createdBy: mongoose.Types.ObjectId;
  linkedinAccountId: mongoose.Types.ObjectId;
  proxyId: mongoose.Types.ObjectId;
  status: CampaignStatus;
  maxResults?: number;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  queuedAt?: Date;
  scheduledFor?: Date;
  recurrence?: CampaignRecurrence;
  scheduleEndDate?: Date;
  priority?: CampaignPriority;
  stats?: {
    profilesFound: number;
    profilesScraped: number;
    failedScrapes: number;
  };
  results: ICampaignResult[];
}

const campaignResultSchema = new Schema({
  profileId: { type: String, required: true },
  profileUrl: { type: String },
  name: { type: String },
  scrapeStatus: { type: String, default: 'pending' },
  scraped: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

/**
 * Campaign Schema
 */
const campaignSchema = new Schema<ICampaign>(
  {
    name: {
      type: String,
      required: [true, 'Campaign name is required'],
      trim: true,
      minlength: [3, 'Campaign name must be at least 3 characters'],
      maxlength: [100, 'Campaign name cannot exceed 100 characters']
    },
    searchQuery: {
      type: String,
      required: [true, 'Search query is required'],
      trim: true
    },
    linkedinAccountId: {
      type: Schema.Types.ObjectId,
      ref: 'LinkedInAccount',
      required: [true, 'LinkedIn account is required']
    },
    proxyId: {
      type: Schema.Types.ObjectId,
      ref: 'Proxy'
    },
    school: { type: String, trim: true },
    company: { type: String, trim: true },
    pastCompany: { type: String, trim: true },
    location: { type: String, trim: true },
    industry: { type: String, trim: true },
    connectionDegree: {
      type: String,
      enum: ['1st', '2nd', '3rd', 'All'],
      default: '2nd'
    },
    keywords: [{ type: String, trim: true }],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: Object.values(CampaignStatus),
      default: CampaignStatus.CREATED
    },
    maxResults: {
      type: Number,
      default: 100,
      min: [1, 'Maximum results must be at least 1'],
      max: [1000, 'Maximum results cannot exceed 1000']
    },
    priority: {
      type: String,
      enum: Object.values(CampaignPriority),
      default: CampaignPriority.MEDIUM
    },
    startedAt: { type: Date },
    completedAt: { type: Date },
    queuedAt: { type: Date },
    scheduledFor: { type: Date },
    recurrence: {
      type: String,
      enum: Object.values(CampaignRecurrence),
      default: CampaignRecurrence.ONCE
    },
    scheduleEndDate: { type: Date },
    stats: {
      profilesFound: { type: Number, default: 0 },
      profilesScraped: { type: Number, default: 0 },
      failedScrapes: { type: Number, default: 0 }
    },
    results: [campaignResultSchema]
  },
  {
    timestamps: true
  }
);

/**
 * Add indexes
 */
campaignSchema.index({ createdBy: 1, status: 1 });
campaignSchema.index({ status: 1, queuedAt: 1 });
campaignSchema.index({ linkedinAccountId: 1 });
campaignSchema.index({ proxyId: 1 });

const Campaign = mongoose.model<ICampaign>('Campaign', campaignSchema);

export default Campaign;
