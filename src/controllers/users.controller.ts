import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import User, { IUserDocument } from "../models/User.model";
import { generateAccessJwt, generateRefreshJwt } from "../helpers/Jwt";
import {
  badRequest,
  unauthorized,
  conflict,
  serverError,
  notFound,
  forbidden,
} from "../helpers/ErrorHandler";
import {
  successResponse,
  dataResponse,
  paginatedResponse,
} from "../interfaces/ApiResponse";
import {
  rolesObj,
  ErrorMessages,
  SuccessMessages,
  Role,
} from "../helpers/Constants";
import { verifyRefreshJwt } from "../helpers/Jwt";

// Helper function for user registration logic
const registerLogic = async (
  userData: any,
  role: Role,
): Promise<IUserDocument> => {
  const {
    firstName,
    lastName,
    email,
    password,
    phoneNumber,
    company,
    location,
  } = userData;

  // Basic validation
  if (!firstName || !lastName || !email || !password) {
    throw badRequest(ErrorMessages.REQUIRED_FIELDS);
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw conflict(ErrorMessages.EMAIL_EXISTS);
  }

  // Create new user
  const newUser = new User({
    firstName,
    lastName,
    email,
    password, // Hashing is handled by pre-save hook
    phoneNumber,
    company,
    location,
    role,
  });

  await newUser.save();
  return newUser;
};

// Helper function for user login logic
const loginLogic = async (
  email: string,
  password: string,
): Promise<{ user: IUserDocument; accessToken: string; refreshToken: string }> => {
  if (!email || !password) {
    throw badRequest("Email and password are required");
  }

  // Find user by email
  const user = await User.findByEmail(email);
  if (!user) {
    throw unauthorized(ErrorMessages.USER_NOT_FOUND);
  }

  // Check if user is active
  if (!user.isActive) {
    throw unauthorized(ErrorMessages.INACTIVE_USER);
  }

  // Compare password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw unauthorized(ErrorMessages.INVALID_PASSWORD);
  }

  // Generate JWT token
  const tokenPayload = {
    id: user._id?.toString() || '',
    email: user.email,
    role: user.role,
  };
  const accessToken = generateAccessJwt(tokenPayload);
  const refreshToken = generateRefreshJwt(user._id?.toString() || '', user.tokenVersion);

  // Update last login timestamp
  user.lastLogin = new Date();
  await user.save();

  return { user, accessToken, refreshToken };
};

/**
 * Register a new standard user
 */
export const registerUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    await registerLogic(req.body, rolesObj.USER);
    res.status(201).json(successResponse(SuccessMessages.USER_CREATED));
  } catch (error: any) {
    // Handle potential validation errors from Mongoose
    if (error.name === "ValidationError") {
      return next(badRequest(error.message));
    }
    // Pass specific errors (like conflict) or general server error
    next(error.status ? error : serverError(error.message));
  }
};

/**
 * Login a standard user
 */
export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { accessToken, refreshToken } = await loginLogic(req.body.email, req.body.password);
    res
      .status(200)
      .json(dataResponse(SuccessMessages.LOGIN_SUCCESS, { accessToken, refreshToken }));
  } catch (error: any) {
    next(error.status ? error : serverError(error.message));
  }
};

/**
 * Register a new admin user
 */
export const registerAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    await registerLogic(req.body, rolesObj.ADMIN);
    res.status(201).json(successResponse("Admin user created successfully"));
  } catch (error: any) {
    if (error.name === "ValidationError") {
      return next(badRequest(error.message));
    }
    next(error.status ? error : serverError(error.message));
  }
};

/**
 * Login an admin user
 */
export const loginAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { user, accessToken, refreshToken } = await loginLogic(req.body.email, req.body.password);

    // Ensure the logged-in user is actually an admin
    if (user.role !== rolesObj.ADMIN) {
      return next(forbidden("Access denied. Admin role required."));
    }

    res.status(200).json(dataResponse("Admin login successful", { accessToken, refreshToken }));
  } catch (error: any) {
    next(error.status ? error : serverError(error.message));
  }
};

/**
 * Get all users (with optional role filtering and pagination)
 */
export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const role = req.query.role as string;

    const query: any = {};
    if (role && Object.values(rolesObj).includes(role as Role)) {
      query.role = role;
    }

    const skip = (page - 1) * limit;

    const users = await User.find(query)
      .skip(skip)
      .limit(limit)
      .select("-password");
    const total = await User.countDocuments(query);

    res.status(200).json(
      paginatedResponse("Users retrieved", users, {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      }),
    );
  } catch (error: any) {
    next(serverError(error.message));
  }
};

/**
 * Get user by ID
 */
export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(badRequest(ErrorMessages.INVALID_ID));
  }

  try {
    const user = await User.findById(id).select("-password");
    if (!user) {
      return next(notFound(ErrorMessages.USER_NOT_FOUND));
    }
    res.status(200).json(dataResponse("User found", user));
  } catch (error: any) {
    next(serverError(error.message));
  }
};

/**
 * Update user
 */
export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { id } = req.params;
  const updateData = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(badRequest(ErrorMessages.INVALID_ID));
  }

  // Remove password from updateData if it's empty or null to avoid accidental overwrite
  if (updateData.password === null || updateData.password === "") {
    delete updateData.password;
  }
  // Prevent role change through this endpoint unless by admin (add separate role change endpoint if needed)
  delete updateData.role;

  try {
    // findByIdAndUpdate will trigger the pre-save hook for password hashing if password is present
    const updatedUser = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!updatedUser) {
      return next(notFound(ErrorMessages.USER_NOT_FOUND));
    }

    res
      .status(200)
      .json(dataResponse(SuccessMessages.USER_UPDATED, updatedUser));
  } catch (error: any) {
    if (error.name === "ValidationError") {
      return next(badRequest(error.message));
    }
    if (error.code === 11000) {
      // Handle duplicate key error (e.g., email)
      return next(conflict("Email already exists"));
    }
    next(serverError(error.message));
  }
};

/**
 * Delete user
 */
export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(badRequest(ErrorMessages.INVALID_ID));
  }

  try {
    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
      return next(notFound(ErrorMessages.USER_NOT_FOUND));
    }
    res.status(200).json(successResponse(SuccessMessages.USER_DELETED));
  } catch (error: any) {
    next(serverError(error.message));
  }
};

// --- Placeholders for functions needing more logic ---

export const getUserDetailsWithCampaigns = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  // TODO: Implement logic using aggregation builder (Task requires Builders implementation)
  next(serverError("Get user details with campaigns - Not yet implemented"));
};

export const setUserRating = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  // TODO: Implement logic for calculating and setting user/lead ratings (Requires CalculateRating helper)
  next(serverError("Set user rating - Not yet implemented"));
};

/**
 * Refresh authentication token
 */
export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return next(badRequest("Refresh token is required"));
    }

    // Verify the refresh token
    const decodedRefreshToken = verifyRefreshJwt(refreshToken);
    if (!decodedRefreshToken) {
      return next(unauthorized("Invalid refresh token"));
    }

    // Find the user
    const user = await User.findById(decodedRefreshToken.userId);
    if (!user) {
      return next(unauthorized("User not found"));
    }

    // Check if the token version matches
    if (user.tokenVersion !== decodedRefreshToken.tokenVersion) {
      return next(unauthorized("Token revoked"));
    }

    // Generate new tokens
    const tokenPayload = {
      id: user._id?.toString() || '',
      email: user.email,
      role: user.role,
    };

    const newAccessToken = generateAccessJwt(tokenPayload);
    const newRefreshToken = generateRefreshJwt(user._id?.toString() || '', user.tokenVersion);

    // Return new tokens
    res.status(200).json(
      dataResponse("Token refreshed successfully", {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      })
    );
  } catch (error: any) {
    next(error.status ? error : serverError(error.message));
  }
};

/**
 * Invalidate all refresh tokens for a user
 * This is useful for logging out on all devices or after a password change
 */
export const revokeUserTokens = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.params.id;

    // Validate user ID
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return next(badRequest(ErrorMessages.INVALID_ID));
    }

    // Find user and increment token version
    const user = await User.findById(userId);
    if (!user) {
      return next(notFound(ErrorMessages.USER_NOT_FOUND));
    }

    // Ensure the user can only revoke their own tokens unless they're an admin
    if (req.user?.id !== userId && req.user?.role !== rolesObj.ADMIN) {
      return next(forbidden("Not authorized to revoke tokens for this user"));
    }

    // Increment token version to invalidate all existing refresh tokens
    user.tokenVersion += 1;
    await user.save();

    res.status(200).json(successResponse("All user tokens revoked successfully"));
  } catch (error: any) {
    next(error.status ? error : serverError(error.message));
  }
};

/**
 * Update user profile (by the user themselves)
 * This endpoint allows users to update their own non-critical profile information
 */
export const updateUserProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Ensure the user exists and is updating their own profile
    if (!req.user) {
      return next(unauthorized("Authentication required"));
    }

    const userId = req.user.id;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return next(notFound(ErrorMessages.USER_NOT_FOUND));
    }

    // Filter allowed fields for profile updates
    const allowedFields = [
      "firstName",
      "lastName",
      "phoneNumber",
      "company",
      "location",
      "profilePicture"
    ];

    const updateData: Partial<IUserDocument> = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field as keyof IUserDocument] = req.body[field];
      }
    }

    // Update the user
    Object.assign(user, updateData);
    await user.save();

    res.status(200).json(dataResponse("Profile updated successfully", user));
  } catch (error: any) {
    // Handle validation errors
    if (error.name === "ValidationError") {
      return next(badRequest(error.message));
    }
    next(error.status ? error : serverError(error.message));
  }
};

/**
 * Change password
 */
export const changePassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Ensure the user exists and is changing their own password
    if (!req.user) {
      return next(unauthorized("Authentication required"));
    }

    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    // Validate request body
    if (!currentPassword || !newPassword) {
      return next(badRequest("Current password and new password are required"));
    }

    // Password strength validation
    if (newPassword.length < 6) {
      return next(badRequest("New password must be at least 6 characters long"));
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return next(notFound(ErrorMessages.USER_NOT_FOUND));
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return next(unauthorized("Current password is incorrect"));
    }

    // Update password
    user.password = newPassword;

    // Increment token version to invalidate all existing refresh tokens
    user.tokenVersion += 1;

    await user.save();

    res.status(200).json(successResponse("Password changed successfully"));
  } catch (error: any) {
    next(error.status ? error : serverError(error.message));
  }
};

/**
 * Get basic profile information of the current user
 */
export const getCurrentUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Ensure the user is authenticated
    if (!req.user) {
      return next(unauthorized("Authentication required"));
    }

    const userId = req.user.id;

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return next(notFound(ErrorMessages.USER_NOT_FOUND));
    }

    res.status(200).json(dataResponse("User profile retrieved successfully", user));
  } catch (error: any) {
    next(error.status ? error : serverError(error.message));
  }
};
