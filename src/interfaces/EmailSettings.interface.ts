import mongoose from "mongoose";

export interface IEmailSettings {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass?: string; // Store securely (encrypted)
  smtpFrom: string;
  // Optional settings
  smtpSecure?: boolean; // e.g., use TLS
  // Audit
  updatedBy?: mongoose.Types.ObjectId;
  lastUpdated?: Date;
}
