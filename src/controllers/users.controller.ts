import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import User, { IUserDocument } from "../models/User.model";
import { generateAccessJwt } from "../helpers/Jwt";
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
): Promise<{ user: IUserDocument; token: string }> => {
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
    id: user._id.toString(),
    email: user.email,
    role: user.role,
  };
  const token = generateAccessJwt(tokenPayload);

  // Update last login timestamp
  user.lastLogin = new Date();
  await user.save();

  return { user, token };
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
    const { token } = await loginLogic(req.body.email, req.body.password);
    res
      .status(200)
      .json(dataResponse(SuccessMessages.LOGIN_SUCCESS, { token }));
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
    const { user, token } = await loginLogic(req.body.email, req.body.password);

    // Ensure the logged-in user is actually an admin
    if (user.role !== rolesObj.ADMIN) {
      return next(forbidden("Access denied. Admin role required."));
    }

    res.status(200).json(dataResponse("Admin login successful", { token }));
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
    const deletedUser = await User.findByIdAndRemove(id);
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
