import mongoose from 'mongoose';

export interface ILeadLog {
  leadId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId; // User who performed action, if applicable
  action: string; // e.g., 'STATUS_CHANGED', 'COMMENT_ADDED', 'SCRAPE_FAILED'
  details?: string;
  previousValue?: any;
  newValue?: any;
}