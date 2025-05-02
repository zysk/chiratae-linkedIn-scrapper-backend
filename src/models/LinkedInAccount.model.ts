import mongoose, { Document, Model, Schema } from 'mongoose';
import { ILinkedInAccount } from '../interfaces/LinkedInAccount.interface';
// TODO: Implement encryption utility
// import { encrypt, decrypt } from '../helpers/Encryption';

// Interface for LinkedInAccount Document
export interface ILinkedInAccountDocument extends ILinkedInAccount, Document {}

// Interface for LinkedInAccount Model
export interface ILinkedInAccountModel extends Model<ILinkedInAccountDocument> {}

// LinkedInAccount Schema
const LinkedInAccountSchema = new Schema<ILinkedInAccountDocument, ILinkedInAccountModel>(
  {
    name: { // LinkedIn email/username
      type: String,
      required: [true, 'LinkedIn account name/email is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String, // Will be stored encrypted
      required: [true, 'LinkedIn password is required'],
    },
    isValid: {
      type: Boolean,
      default: true, // Assume valid until verification fails
    },
    lastUsed: {
      type: Date,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    // Audit
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// TODO: Add pre-save hook for password encryption
/*
LinkedInAccountSchema.pre('save', async function(this: ILinkedInAccountDocument, next) {
  if (!this.isModified('password') || !this.password) return next();
  try {
    this.password = await encrypt(this.password);
    next();
  } catch (error: any) {
    next(error);
  }
});
*/

// TODO: Consider adding a virtual or method to decrypt password temporarily for use
// NEVER return decrypted password in API responses

// Indexes
LinkedInAccountSchema.index({ name: 1 });
LinkedInAccountSchema.index({ isValid: 1, isBlocked: 1 });

// LinkedInAccount Model
const LinkedInAccount = mongoose.model<ILinkedInAccountDocument, ILinkedInAccountModel>(
  'LinkedInAccount',
  LinkedInAccountSchema
);

export default LinkedInAccount;