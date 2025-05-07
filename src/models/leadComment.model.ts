import mongoose, { Document, Schema } from 'mongoose';

/**
 * LeadComment interface
 * Used to store comments on leads
 */
export interface ILeadComment extends Document {
  leadId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * LeadComment Schema
 */
const leadCommentSchema = new Schema<ILeadComment>(
  {
    leadId: {
      type: Schema.Types.ObjectId,
      ref: 'Lead',
      required: [true, 'Lead ID is required']
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required']
    },
    comment: {
      type: String,
      required: [true, 'Comment text is required'],
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// Add indexes for faster queries
leadCommentSchema.index({ leadId: 1 });
leadCommentSchema.index({ userId: 1 });
leadCommentSchema.index({ createdAt: -1 });

const LeadComment = mongoose.model<ILeadComment>('LeadComment', leadCommentSchema);

export default LeadComment;
