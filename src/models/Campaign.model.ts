import mongoose, { Document, Model, Schema } from "mongoose";
import { ICampaign, ICampaignStats, ICampaignExecutionLog } from "../interfaces/Campaign.interface";
import { campaignStatusObj } from "../helpers/Constants";

// Interface for Campaign Document (includes Mongoose methods)
export interface ICampaignDocument extends ICampaign, Document {
  // Instance methods
  updateStats(stats: Partial<ICampaignStats>): Promise<void>;
  addLogEntry(event: string, details: string, error?: string): Promise<void>;
}

// Interface for Campaign Model (static methods)
export interface ICampaignModel extends Model<ICampaignDocument> {
  findDueCampaigns(): Promise<ICampaignDocument[]>;
}

// Campaign Execution Log Schema
const CampaignExecutionLogSchema = new Schema<ICampaignExecutionLog>(
  {
    timestamp: {
      type: Date,
      default: Date.now,
    },
    event: {
      type: String,
      required: true,
    },
    details: {
      type: String,
    },
    error: {
      type: String,
    },
  },
  { _id: false }
);

// Campaign Stats Schema
const CampaignStatsSchema = new Schema<ICampaignStats>(
  {
    totalResults: {
      type: Number,
      default: 0,
    },
    processedResults: {
      type: Number,
      default: 0,
    },
    successfulScrapes: {
      type: Number,
      default: 0,
    },
    failedScrapes: {
      type: Number,
      default: 0,
    },
    newLeadsGenerated: {
      type: Number,
      default: 0,
    },
    duplicateLeadsSkipped: {
      type: Number,
      default: 0,
    },
    lastPageProcessed: {
      type: Number,
      default: 0,
    },
    pagesRemaining: {
      type: Number,
      default: 0,
    },
    estimatedTimeRemaining: {
      type: Number,
    },
    errors: {
      type: [String],
      default: [],
    },
    lastUpdateTime: {
      type: Date,
      default: Date.now,
    }
  },
  { _id: false }
);

// LinkedIn Search Filters Schema
const LinkedInSearchFiltersSchema = new Schema(
  {
    // Basic Profile Filters
    company: {
      type: String,
      trim: true,
    },
    school: {
      type: String,
      trim: true,
    },
    pastCompany: {
      type: String,
      trim: true,
    },
    industryName: {
      type: String,
      trim: true,
    },

    // Position Filters
    title: {
      type: String,
      trim: true,
    },
    pastTitle: {
      type: String,
      trim: true,
    },
    seniority: {
      type: [String],
    },
    yearsOfExperience: {
      type: Number,
      min: 0,
      max: 50,
    },

    // Geography Filters
    location: {
      type: String,
      trim: true,
    },
    region: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      trim: true,
    },
    geoUrn: {
      type: String,
      trim: true,
    },

    // Connection Filters
    connectionDegree: {
      type: [Number],
      enum: [1, 2, 3],
    },
    network: {
      type: [String],
    },

    // Additional Filters
    keywords: {
      type: String,
      trim: true,
    },
    profileLanguage: {
      type: String,
      trim: true,
    },
    currentCompanySize: {
      type: [String],
    },
    currentCompanyHeadcount: {
      type: Number,
    },

    // Boolean Filters
    openToWork: {
      type: Boolean,
      default: false,
    },
    recentActivity: {
      type: Boolean,
      default: false,
    },
    premium: {
      type: Boolean,
      default: false,
    },
    jobSeekers: {
      type: Boolean,
      default: false,
    },

    // Advanced Filters
    skills: {
      type: [String],
    },
    groups: {
      type: [String],
    },
    profileLanguages: {
      type: [String],
    },

    // Custom Filters
    customFilterJson: {
      type: String,
    },
  },
  { _id: false }
);

// Campaign Schema
const CampaignSchema = new Schema<ICampaignDocument, ICampaignModel>(
  {
    name: {
      type: String,
      required: [true, "Campaign name is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    searchQuery: {
      type: String,
      required: [true, "Search query is required"],
      trim: true,
    },
    searchUrl: {
      type: String,
      trim: true,
    },

    // Relationships
    linkedInAccountId: {
      type: Schema.Types.ObjectId,
      ref: "LinkedInAccount",
      required: [true, "LinkedIn account is required"],
    },
    proxyId: {
      type: Schema.Types.ObjectId,
      ref: "Proxy",
    },
    resultsArr: [
      {
        type: Schema.Types.ObjectId,
        ref: "Lead",
      },
    ],

    // Status and Processing
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
    priority: {
      type: Number,
      min: 1,
      max: 10,
      default: 5,
    },

    // Search Filters (replaced individual filters with filters object)
    filters: LinkedInSearchFiltersSchema,

    // Execution Statistics
    stats: CampaignStatsSchema,
    runCount: {
      type: Number,
      default: 0,
    },
    lastRun: {
      type: Date,
    },
    nextRun: {
      type: Date,
    },
    executionLogs: [CampaignExecutionLogSchema],

    // Scheduling
    schedule: {
      type: String, // Cron pattern
      trim: true,
    },
    isScheduled: {
      type: Boolean,
      default: false,
    },
    maxProfilesPerRun: {
      type: Number,
      min: 1,
      max: 1000,
      default: 100,
    },
    maxRunTimeMinutes: {
      type: Number,
      min: 1,
      max: 1440, // 24 hours
      default: 60, // 1 hour
    },

    // Rate Limiting
    requestsPerMinute: {
      type: Number,
      min: 1,
      max: 60,
      default: 10,
    },
    delayBetweenProfiles: {
      type: Number,
      min: 0,
      max: 30000, // 30 seconds
      default: 3000, // 3 seconds
    },

    // Targeting
    targetLeadCount: {
      type: Number,
      min: 1,
    },
    targetCompletionDate: {
      type: Date,
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

    // Notifications
    notifyOnCompletion: {
      type: Boolean,
      default: false,
    },
    notifyOnFailure: {
      type: Boolean,
      default: false,
    },
    notificationEmail: {
      type: String,
      trim: true,
      validate: {
        validator: function(email: string) {
          return !email || /^\w+([-]?\w+)*@\w+([-]?\w+)*(\.\w{2,3})+$/.test(email);
        },
        message: "Please enter a valid email address for notifications"
      }
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Indexes
CampaignSchema.index({ status: 1, isSearched: 1, processing: 1 });
CampaignSchema.index({ createdBy: 1 });
CampaignSchema.index({ priority: -1, createdAt: 1 }); // For priority-based queue processing
CampaignSchema.index({ isScheduled: 1, nextRun: 1 }); // For scheduled campaign selection

// Pre-save middleware to set nextRun based on schedule
CampaignSchema.pre("save", function(next) {
  // If schedule is set, calculate the next run time
  if (this.isScheduled && this.schedule) {
    // This would typically use a cron parser library to calculate the next run time
    // For now, we'll set it to 1 hour in the future as a placeholder
    this.nextRun = new Date(Date.now() + 60 * 60 * 1000);
  }
  next();
});

// Statics - Model level methods
CampaignSchema.statics = {
  // Find campaigns that are scheduled to run now
  findDueCampaigns: async function(): Promise<ICampaignDocument[]> {
    const now = new Date();

    return this.find({
      isScheduled: true,
      processing: false,
      status: { $in: [campaignStatusObj.CREATED, campaignStatusObj.COMPLETED] },
      nextRun: { $lte: now }
    }).sort({ priority: -1, nextRun: 1 });
  },

  // Find campaigns by status
  findByStatus: function(status: string) {
    return this.find({ status }).sort({ priority: -1, createdAt: 1 });
  }
};

// Methods - Document level methods
CampaignSchema.methods = {
  // Add execution log entry
  addLogEntry: async function(event: string, details: string, error?: string): Promise<void> {
    const logEntry: ICampaignExecutionLog = {
      timestamp: new Date(),
      event,
      details,
    };

    if (error) {
      logEntry.error = error;
    }

    if (!this.executionLogs) {
      this.executionLogs = [];
    }

    // Add the log entry to the beginning of the array for most recent first
    this.executionLogs.unshift(logEntry);

    // Limit the log size to avoid excessive memory usage
    const MAX_LOGS = 1000;
    if (this.executionLogs.length > MAX_LOGS) {
      this.executionLogs = this.executionLogs.slice(0, MAX_LOGS);
    }

    // Mark the path as modified to ensure it's saved
    this.markModified('executionLogs');
  },

  // Update campaign statistics
  updateStats: async function(statsUpdate: Partial<ICampaignStats>): Promise<void> {
    // Create a new stats object if it doesn't exist
    if (!this.stats) {
      this.stats = {};
    }

    // Update each provided stat field
    Object.keys(statsUpdate).forEach(key => {
      if (key === 'errors' && Array.isArray(statsUpdate.errors) && statsUpdate.errors.length > 0) {
        // For errors array, append new errors rather than replacing
        if (!this.stats.errors) {
          this.stats.errors = [];
        }
        this.stats.errors.push(...statsUpdate.errors);
      } else {
        // For other fields, just update the value
        (this.stats as any)[key] = (statsUpdate as any)[key];
      }
    });

    // Always update the lastUpdateTime
    this.stats.lastUpdateTime = new Date();

    // Mark the path as modified to ensure it's saved
    this.markModified('stats');
  }
};

// Campaign Model
const Campaign = mongoose.model<ICampaignDocument, ICampaignModel>(
  "Campaign",
  CampaignSchema,
);

export default Campaign;
