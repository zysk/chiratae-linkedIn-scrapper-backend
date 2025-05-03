import mongoose, { Document, Model, Schema } from "mongoose";
import bcrypt from "bcryptjs";
import { Role, rolesObj, Rating, ratingObj } from "../helpers/Constants";

/**
 * User attributes interface
 */
export interface IUser {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  company?: string;
  location?: string;
  profilePicture?: string;
  role: Role;
  isActive: boolean;
  lastLogin?: Date;
  tokenVersion: number;
  leadRating?: Rating;
  leadRatingScore?: number;
  createdBy?: mongoose.Types.ObjectId | string;
  updatedBy?: mongoose.Types.ObjectId | string;
}

/**
 * User document interface (includes mongoose document methods)
 */
export interface IUserDocument extends IUser, Document {
  fullName: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

/**
 * User model interface (static methods)
 */
export interface IUserModel extends Model<IUserDocument> {
  findByEmail(email: string): Promise<IUserDocument | null>;
}

/**
 * User schema
 */
const UserSchema = new Schema<IUserDocument, IUserModel>(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email address",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    company: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    profilePicture: {
      type: String,
    },
    role: {
      type: String,
      enum: Object.values(rolesObj),
      default: rolesObj.USER,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    tokenVersion: {
      type: Number,
      default: 0,
    },
    leadRating: {
      type: String,
      enum: Object.values(ratingObj),
      default: ratingObj.MEDIUM,
    },
    leadRatingScore: {
      type: Number,
      default: 0,
    },
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

/**
 * Virtual for user's full name
 */
UserSchema.virtual("fullName").get(function (this: IUserDocument) {
  return `${this.firstName} ${this.lastName}`;
});

/**
 * Hash password before saving
 */
UserSchema.pre("save", async function (this: IUserDocument, next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified("password")) return next();

  try {
    // Generate a salt
    const salt = await bcrypt.genSalt(10);

    // Hash the password with the salt
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

/**
 * Compare password method
 */
UserSchema.methods.comparePassword = async function (
  this: IUserDocument,
  candidatePassword: string,
): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    return false;
  }
};

/**
 * Find user by email static method
 */
UserSchema.statics.findByEmail = function (
  this: IUserModel,
  email: string,
): Promise<IUserDocument | null> {
  return this.findOne({ email }).exec();
};

/**
 * Set JSON transform to remove sensitive information
 */
UserSchema.set("toJSON", {
  transform: function (_: any, ret: any) {
    delete ret.password;
    return ret;
  },
});

/**
 * User model
 */
const User = mongoose.model<IUserDocument, IUserModel>("User", UserSchema);

export default User;
