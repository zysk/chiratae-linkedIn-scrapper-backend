import mongoose from 'mongoose';
import { CampaignStatus } from '../helpers/Constants';

export interface ICampaign {
  name: string;
  searchQuery: string;
  linkedInAccountId: mongoose.Types.ObjectId;
  proxyId?: mongoose.Types.ObjectId;
  status: CampaignStatus;
  isSearched: boolean;
  processing: boolean;
  totalResults?: number;
  resultsArr?: mongoose.Types.ObjectId[]; // Array of Lead IDs
  runCount?: number;
  lastRun?: Date;
  // Filters
  school?: string;
  company?: string;
  pastCompany?: string;
  // Schedule
  schedule?: string; // Cron pattern
  isScheduled?: boolean;
  // Audit
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
}