import mongoose from 'mongoose';

export interface ILinkedInAccount {
  name: string; // LinkedIn email/username
  password?: string; // Store securely (encrypted)
  // Status/tracking fields
  isValid?: boolean;
  lastUsed?: Date;
  usageCount?: number;
  isBlocked?: boolean;
  // Audit
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
}