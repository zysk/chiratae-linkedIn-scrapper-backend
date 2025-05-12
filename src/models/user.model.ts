import bcrypt from 'bcryptjs';
import mongoose, { Document, Schema } from 'mongoose';
import { rolesObj } from '../utils/constants';

// Define interface for User document
export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: string;
  isActive: boolean;
  phone?: number;
  employeeId?: string;
  searchCompleted?: boolean;
  campaignId?: mongoose.Types.ObjectId;
  link?: string;
  educationArr?: Array<any>;
  experienceArr?: Array<any>;
  contactInfoArr?: Array<any>;
  location?: string;
  currentPosition?: string;
  rating?: string;
  mailSettingsObj?: {
    mailHost?: string;
    mailPort?: string;
    mailUserName?: string;
    mailUserPassword?: string;
    mailEncryption?: string;
    mailService?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema(
  {
    // Common fields
    name: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address']
    },
    password: { type: String, required: true },
    isActive: { type: Boolean, default: false },
    role: {
      type: String,
      enum: Object.values(rolesObj),
      default: rolesObj.USER,
    },
    searchCompleted: { type: Boolean, default: false },

    // User specific fields
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' },
    phone: { type: Number },
    employeeId: { type: String },

    // Client specific fields
    link: { type: String },
    educationArr: { type: [Schema.Types.Mixed] },
    experienceArr: { type: [Schema.Types.Mixed] },
    contactInfoArr: { type: [Schema.Types.Mixed] },
    location: { type: String },
    currentPosition: { type: String },
    rating: { type: String },
    mailSettingsObj: {
      mailHost: { type: String },
      mailPort: { type: String },
      mailUserName: { type: String },
      mailUserPassword: { type: String },
      mailEncryption: { type: String },
      mailService: { type: String },
    },
  },
  { timestamps: true }
);

// Pre-save middleware to hash password before saving
UserSchema.pre<IUser>('save', async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Generate salt and hash password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare password for login
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Error comparing passwords');
  }
};

export default mongoose.model<IUser>('User', UserSchema);
