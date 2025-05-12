import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { ApiError } from '../middleware/errorHandler';
import User from '../models/user.model';
import UserRating from '../models/userRating.model';
import { rolesObj } from '../utils/constants';

/**
 * Rate a user
 * @route POST /api/ratings
 */
export const rateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId, rating, comment } = req.body;
    const ratedByUserId = req.user?.userId;

    // Check if required fields are provided
    if (!userId || !rating || !ratedByUserId) {
      throw new ApiError('User ID and rating are required', 400);
    }

    // Check if rating is valid
    if (rating < 1 || rating > 5) {
      throw new ApiError('Rating must be between 1 and 5', 400);
    }

    // Check if user is trying to rate themselves
    if (userId === ratedByUserId) {
      throw new ApiError('You cannot rate yourself', 400);
    }

    // Verify that both users exist
    const [ratedUser, raterUser] = await Promise.all([
      User.findById(userId),
      User.findById(ratedByUserId)
    ]);

    if (!ratedUser) {
      throw new ApiError('User to rate not found', 404);
    }

    if (!raterUser) {
      throw new ApiError('Rating user not found', 404);
    }

    // Check if the user being rated is a CLIENT (as per requirements)
    if (ratedUser.role !== rolesObj.CLIENT) {
      throw new ApiError('Only CLIENT users can be rated', 400);
    }

    // Upsert the rating (update if exists, create if not)
    const updatedRating = await UserRating.findOneAndUpdate(
      { userId, ratedByUserId },
      {
        $set: {
          rating,
          comment: comment || ''
        }
      },
      { new: true, upsert: true, runValidators: true }
    );

    // Update the user's average rating
    await updateUserAverageRating(userId);

    res.status(200).json({
      success: true,
      message: 'Rating submitted successfully',
      data: updatedRating
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get ratings for a user
 * @route GET /api/ratings/:userId
 */
export const getUserRatings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new ApiError('Invalid user ID', 400);
    }

    // Check if user exists
    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError('User not found', 404);
    }

    // Get all ratings for the user
    const ratings = await UserRating.find({ userId })
      .populate('ratedByUserId', 'name email')
      .sort({ createdAt: -1 });

    // Calculate average rating
    const avgRating = ratings.length > 0
      ? ratings.reduce((sum, rating) => sum + rating.rating, 0) / ratings.length
      : 0;

    res.status(200).json({
      success: true,
      count: ratings.length,
      averageRating: avgRating.toFixed(1),
      data: ratings
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user's average rating
 * @param userId User ID to update rating for
 */
const updateUserAverageRating = async (userId: string): Promise<void> => {
  try {
    // Calculate average rating
    const ratings = await UserRating.find({ userId });

    if (ratings.length === 0) {
      return;
    }

    const avgRating = ratings.reduce((sum, item) => sum + item.rating, 0) / ratings.length;

    // Convert numerical rating to textual rating for compatibility with old code
    let ratingText = 'LOW';
    if (avgRating >= 4) {
      ratingText = 'HIGH';
    } else if (avgRating >= 3) {
      ratingText = 'MEDIUM';
    }

    // Update user's rating field
    await User.findByIdAndUpdate(userId, { rating: ratingText });
  } catch (error) {
    console.error('Error updating user average rating:', error);
  }
};
