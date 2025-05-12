import mongoose, { Document, Schema } from 'mongoose';

export interface IUserRating extends Document {
  userId: mongoose.Types.ObjectId;      // User receiving the rating
  ratedByUserId: mongoose.Types.ObjectId; // User giving the rating
  rating: number;                         // Rating value (1-5)
  comment?: string;                       // Optional comment
  createdAt: Date;
  updatedAt: Date;
}

const UserRatingSchema: Schema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    ratedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      maxlength: 1000,
    },
  },
  { timestamps: true }
);

// Ensure a user can rate another user only once (can update existing rating)
UserRatingSchema.index({ userId: 1, ratedByUserId: 1 }, { unique: true });

export default mongoose.model<IUserRating>('UserRating', UserRatingSchema);
