import mongoose from "mongoose";
import { CampaignStatus } from "../helpers/Constants";

/**
 * LinkedIn Search Filter Types
 */
export interface ILinkedInSearchFilters {
  // Basic Profile Filters
  company?: string;              // Current company
  school?: string;               // Education institution
  pastCompany?: string;          // Previous company
  industryName?: string;         // Industry the person works in

  // Position Filters
  title?: string;                // Current job title
  pastTitle?: string;            // Previous job title
  seniority?: string[];          // Seniority level (e.g., "SENIOR", "MANAGER", etc.)
  yearsOfExperience?: number;    // Years of professional experience

  // Geography Filters
  location?: string;             // Location/city
  region?: string;               // Region/state/province
  country?: string;              // Country
  geoUrn?: string;               // LinkedIn's geo URN identifier

  // Connection Filters
  connectionDegree?: number[];   // Connection degree (1st, 2nd, 3rd)
  network?: string[];            // Network filters

  // Additional Filters
  keywords?: string;             // General keywords
  profileLanguage?: string;      // Profile language
  currentCompanySize?: string[]; // Current company size ranges
  currentCompanyHeadcount?: number; // Exact company headcount

  // Boolean Filters
  openToWork?: boolean;          // People open to work
  recentActivity?: boolean;      // People with recent activity
  premium?: boolean;             // Premium members only
  jobSeekers?: boolean;          // Active job seekers

  // Advanced Filters
  skills?: string[];             // Skills
  groups?: string[];             // LinkedIn groups
  profileLanguages?: string[];   // Languages spoken

  // Custom Filters
  customFilterJson?: string;     // Store any custom filters in JSON
}

/**
 * Campaign Execution Statistics
 */
export interface ICampaignStats {
  totalResults: number;          // Total search results found
  processedResults: number;      // Number of profiles processed
  successfulScrapes: number;     // Successfully scraped profiles
  failedScrapes: number;         // Failed scraping attempts
  newLeadsGenerated: number;     // New leads generated
  duplicateLeadsSkipped: number; // Duplicate leads skipped
  lastPageProcessed: number;     // Last search results page processed
  pagesRemaining: number;        // Estimated pages remaining
  estimatedTimeRemaining?: number; // Estimated time to complete (minutes)
  errors: string[];              // List of recent errors
  lastUpdateTime: Date;          // Last time stats were updated
}

/**
 * Campaign Execution Logs
 */
export interface ICampaignExecutionLog {
  timestamp: Date;
  event: string;
  details?: string;
  error?: string;
}

/**
 * Campaign Interface
 */
export interface ICampaign {
  name: string;                              // Campaign name
  description?: string;                      // Campaign description
  searchQuery: string;                       // Main search query
  searchUrl?: string;                        // Generated search URL

  // Relationships
  linkedInAccountId: mongoose.Types.ObjectId; // LinkedIn account to use
  proxyId?: mongoose.Types.ObjectId;          // Proxy server to use
  resultsArr?: mongoose.Types.ObjectId[];     // Array of Lead IDs

  // Status and Processing
  status: CampaignStatus;                     // Campaign status
  isSearched: boolean;                        // Initial search completed?
  processing: boolean;                        // Currently being processed?
  priority?: number;                          // Execution priority (1-10)

  // Search Filters
  filters?: ILinkedInSearchFilters;           // Detailed search filters

  // Execution Statistics
  stats?: ICampaignStats;                     // Campaign execution statistics
  runCount?: number;                          // Number of times run
  lastRun?: Date;                             // Last execution time
  nextRun?: Date;                             // Next scheduled run
  executionLogs?: ICampaignExecutionLog[];    // Execution logs

  // Scheduling
  schedule?: string;                          // Cron pattern
  isScheduled?: boolean;                      // Is scheduled to run?
  maxProfilesPerRun?: number;                 // Maximum profiles to process per run
  maxRunTimeMinutes?: number;                 // Maximum run time in minutes

  // Rate Limiting
  requestsPerMinute?: number;                 // Max LinkedIn requests per minute
  delayBetweenProfiles?: number;              // Delay between profile scrapes (ms)

  // Targeting
  targetLeadCount?: number;                   // Target number of leads to generate
  targetCompletionDate?: Date;                // Target date to complete by

  // Audit
  createdBy?: mongoose.Types.ObjectId;        // User who created the campaign
  updatedBy?: mongoose.Types.ObjectId;        // User who last updated the campaign

  // Notifications
  notifyOnCompletion?: boolean;               // Send notification when complete
  notifyOnFailure?: boolean;                  // Send notification on failure
  notificationEmail?: string;                 // Email for notifications
}
