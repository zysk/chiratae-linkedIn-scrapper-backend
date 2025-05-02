import mongoose, { Document, Model, Schema } from "mongoose";

// Interface for user-related logs
export interface IUserLog {
  userId?: mongoose.Types.ObjectId; // User who triggered the log, if applicable
  eventType: string; // e.g., 'LOGIN_SUCCESS', 'LOGIN_FAILURE', 'SCRAPE_START', 'RATE_LIMIT'
  details?: string;
  ipAddress?: string;
  timestamp: Date;
}

export interface IUserLogDocument extends IUserLog, Document {}
export interface IUserLogModel extends Model<IUserLogDocument> {}

const UserLogSchema = new Schema<IUserLogDocument, IUserLogModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    eventType: {
      type: String,
      required: true,
      index: true,
    },
    details: {
      type: String,
    },
    ipAddress: {
      type: String,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
    },
  },
  {
    timestamps: false, // Use specific timestamp field
    versionKey: false,
  },
);

const UserLog = mongoose.model<IUserLogDocument, IUserLogModel>(
  "UserLog",
  UserLogSchema,
);

export default UserLog;
