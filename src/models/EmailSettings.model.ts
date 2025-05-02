import mongoose, { Document, Model, Schema } from 'mongoose';
import { IEmailSettings } from '../interfaces/EmailSettings.interface';
// TODO: Implement encryption utility
// import { encrypt, decrypt } from '../helpers/Encryption';

// Interface for EmailSettings Document
export interface IEmailSettingsDocument extends IEmailSettings, Document {}

// Interface for EmailSettings Model
export interface IEmailSettingsModel extends Model<IEmailSettingsDocument> {
  // Ensure only one settings document exists
  findSingleton(): Promise<IEmailSettingsDocument | null>;
  createOrUpdateSingleton(settings: Partial<IEmailSettings>, userId?: mongoose.Types.ObjectId): Promise<IEmailSettingsDocument | null>;
}

// EmailSettings Schema
const EmailSettingsSchema = new Schema<IEmailSettingsDocument, IEmailSettingsModel>(
  {
    smtpHost: {
      type: String,
      required: [true, 'SMTP host is required'],
      trim: true,
    },
    smtpPort: {
      type: Number,
      required: [true, 'SMTP port is required'],
    },
    smtpUser: {
      type: String,
      required: [true, 'SMTP user is required'],
      trim: true,
    },
    smtpPass: {
      type: String, // Will be stored encrypted
      required: [true, 'SMTP password is required'],
    },
    smtpFrom: {
      type: String,
      required: [true, 'SMTP From address is required'],
      trim: true,
    },
    smtpSecure: {
      type: Boolean,
      default: true, // Default to using TLS
    },
    // Audit
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: { createdAt: false, updatedAt: true }, // Only track updates
    versionKey: false,
  }
);

// Pre-update hook to update lastUpdated timestamp
EmailSettingsSchema.pre('findOneAndUpdate', function(this: any, next) {
  this.set({ lastUpdated: new Date() });
  next();
});

// TODO: Add pre-save/pre-update hook for password encryption
/*
EmailSettingsSchema.pre('save', async function(this: IEmailSettingsDocument, next) {
  if (!this.isModified('smtpPass') || !this.smtpPass) return next();
  try {
    this.smtpPass = await encrypt(this.smtpPass);
    next();
  } catch (error: any) {
    next(error);
  }
});

EmailSettingsSchema.pre('findOneAndUpdate', async function(this: any, next) {
  if (this._update.smtpPass) {
    try {
      this._update.smtpPass = await encrypt(this._update.smtpPass);
    } catch (error: any) {
      return next(error);
    }
  }
  next();
});
*/

// Static method to find the single settings document
EmailSettingsSchema.statics.findSingleton = function(
  this: IEmailSettingsModel
): Promise<IEmailSettingsDocument | null> {
  return this.findOne().exec();
};

// Static method to create or update the single settings document
EmailSettingsSchema.statics.createOrUpdateSingleton = async function(
  this: IEmailSettingsModel,
  settings: Partial<IEmailSettings>,
  userId?: mongoose.Types.ObjectId
): Promise<IEmailSettingsDocument | null> {
  const options = { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true };
  const updateData = { ...settings, updatedBy: userId };
  return this.findOneAndUpdate({}, updateData, options).exec();
};

// EmailSettings Model
const EmailSettings = mongoose.model<IEmailSettingsDocument, IEmailSettingsModel>(
  'EmailSettings',
  EmailSettingsSchema
);

export default EmailSettings;