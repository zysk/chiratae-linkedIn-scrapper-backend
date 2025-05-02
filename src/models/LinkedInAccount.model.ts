import mongoose, { Document, Model, Schema } from "mongoose";
import { ILinkedInAccount } from "../interfaces/LinkedInAccount.interface";
import {
  encryptPassword,
  decryptPassword,
  isEncrypted,
} from "../helpers/Encryption";
import Logger from "../helpers/Logger";

const logger = new Logger({ context: "linkedin-account-model" });

// Interface for LinkedInAccount Document
export interface ILinkedInAccountDocument extends ILinkedInAccount, Document {
  // Add method for decrypting password
  getDecryptedPassword(): Promise<string | null>;
}

// Interface for LinkedInAccount Model
export interface ILinkedInAccountModel extends Model<ILinkedInAccountDocument> {
  // Add static methods if needed
}

// LinkedInAccount Schema
const LinkedInAccountSchema = new Schema<
  ILinkedInAccountDocument,
  ILinkedInAccountModel
>(
  {
    name: {
      // LinkedIn email/username
      type: String,
      required: [true, "LinkedIn account name/email is required"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String, // Will be stored encrypted
      required: [true, "LinkedIn password is required"],
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
      ref: "User",
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Pre-save hook for password encryption
LinkedInAccountSchema.pre("save", async function (next) {
  // Skip encryption if password hasn't been modified or is already encrypted
  if (!this.isModified("password") || isEncrypted(this.password)) {
    return next();
  }

  try {
    // Encrypt the password
    this.password = await encryptPassword(this.password);
    next();
  } catch (error) {
    logger.error("Error encrypting LinkedIn account password:", error);
    next(
      error instanceof Error ? error : new Error("Password encryption failed"),
    );
  }
});

// Method to get decrypted password - use only when needed for authentication
LinkedInAccountSchema.methods.getDecryptedPassword = async function (): Promise<
  string | null
> {
  try {
    return await decryptPassword(this.password);
  } catch (error) {
    logger.error("Error decrypting LinkedIn account password:", error);
    return null;
  }
};

// Hide sensitive information in JSON responses
LinkedInAccountSchema.set("toJSON", {
  transform: function (_doc, ret) {
    // Never return the password, even in its encrypted form
    delete ret.password;
    return ret;
  },
});

// Indexes
LinkedInAccountSchema.index({ name: 1 });
LinkedInAccountSchema.index({ isValid: 1, isBlocked: 1 });

// LinkedInAccount Model
const LinkedInAccount = mongoose.model<
  ILinkedInAccountDocument,
  ILinkedInAccountModel
>("LinkedInAccount", LinkedInAccountSchema);

export default LinkedInAccount;
