import mongoose, { Document, Schema } from 'mongoose';

/**
 * PreviousLeads interface
 * Used to track already processed LinkedIn profile IDs
 * to avoid duplicates during search
 */
export interface IPreviousLeads extends Document {
	value: string; // LinkedIn profile ID
	createdAt: Date;
}

/**
 * PreviousLeads Schema
 */
const previousLeadsSchema = new Schema<IPreviousLeads>(
	{
		value: {
			type: String,
			required: [true, 'Profile ID is required'],
			unique: true,
			trim: true
		}
	},
	{
		timestamps: true
	}
);

// Add indexes for faster lookup
previousLeadsSchema.index({ value: 1 }, { unique: true });

const PreviousLeads = mongoose.model<IPreviousLeads>('PreviousLeads', previousLeadsSchema);

export default PreviousLeads;
