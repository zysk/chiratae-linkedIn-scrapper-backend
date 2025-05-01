import mongoose, { Document, Model, Schema } from 'mongoose';
import { ILeadLog } from '../interfaces/LeadLog.interface';

// Interface for LeadLog Document
export interface ILeadLogDocument extends ILeadLog, Document {}

// Interface for LeadLog Model
export interface ILeadLogModel extends Model<ILeadLogDocument> {}

// LeadLog Schema
const LeadLogSchema = new Schema<ILeadLogDocument, ILeadLogModel>(
  {
    leadId: {
      type: Schema.Types.ObjectId,
      ref: 'Lead',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    action: {
      type: String,
      required: [true, 'Log action is required'],
      trim: true,
    },
    details: {
      type: String,
      trim: true,
    },
    previousValue: {
      type: Schema.Types.Mixed,
    },
    newValue: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Only track creation time for logs
    versionKey: false,
  }
);

// Indexes
LeadLogSchema.index({ leadId: 1, createdAt: -1 });
LeadLogSchema.index({ userId: 1, createdAt: -1 });
LeadLogSchema.index({ action: 1, createdAt: -1 });

// LeadLog Model
const LeadLog = mongoose.model<ILeadLogDocument, ILeadLogModel>('LeadLog', LeadLogSchema);

export default LeadLog;