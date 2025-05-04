import mongoose, { Document, Schema, Model } from 'mongoose';
import { encrypt, decrypt } from '../utils/encryption.utils';

// Interface representing the LinkedIn Account document
export interface ILinkedInAccount extends Document {
  username: string;
  encryptedPassword: string;
  email?: string;
  description?: string;
  isActive: boolean;
  lastUsed?: Date;
  usageCount: number;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  setPassword: (password: string) => void;
  getPassword: () => string;
}

// Interface for the LinkedIn Account model with static methods
export interface ILinkedInAccountModel extends Model<ILinkedInAccount> {
  findAvailable(): Promise<ILinkedInAccount[]>;
  incrementUsage(accountId: mongoose.Types.ObjectId): Promise<void>;
}

// Schema definition
const linkedInAccountSchema = new Schema<ILinkedInAccount>(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
    },
    encryptedPassword: {
      type: String,
      required: [true, 'Password is required'],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastUsed: {
      type: Date,
      default: null,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator is required'],
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

// Method to set encrypted password
linkedInAccountSchema.methods.setPassword = function (password: string): void {
  this.encryptedPassword = encrypt(password);
};

// Method to get decrypted password
linkedInAccountSchema.methods.getPassword = function (): string {
  return this.encryptedPassword ? decrypt(this.encryptedPassword) : '';
};

// Static method to find available accounts
linkedInAccountSchema.statics.findAvailable = async function (): Promise<ILinkedInAccount[]> {
  return this.find({ isActive: true })
    .sort({ usageCount: 1, lastUsed: 1 })
    .limit(10);
};

// Static method to increment usage count for an account
linkedInAccountSchema.statics.incrementUsage = async function (
  accountId: mongoose.Types.ObjectId
): Promise<void> {
  await this.findByIdAndUpdate(
    accountId,
    {
      $inc: { usageCount: 1 },
      lastUsed: new Date(),
    },
    { new: true }
  );
};

// Pre-save hook to check for duplicate accounts based on username
linkedInAccountSchema.pre('save', async function(next) {
  if (this.isNew) {
    const LinkedInAccount = mongoose.model<ILinkedInAccount, ILinkedInAccountModel>('LinkedInAccount', linkedInAccountSchema);
    const existingAccount = await LinkedInAccount.findOne({
      username: this.username,
    });

    if (existingAccount) {
      return next(new Error('LinkedIn account with this username already exists'));
    }
  }
  next();
});

// Create and export the model
const LinkedInAccount = mongoose.model<ILinkedInAccount, ILinkedInAccountModel>('LinkedInAccount', linkedInAccountSchema);
export default LinkedInAccount;
