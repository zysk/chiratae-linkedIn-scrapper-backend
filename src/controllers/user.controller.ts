import { Request, Response, NextFunction } from 'express';
import User, { IUser } from '../models/user.model';
import { generateAccessToken, generateRefreshToken, validateEmail, comparePasswords, hashPassword, JwtPayload, verifyToken } from '../utils/auth.utils';
import { rolesObj } from '../utils/constants';
import { ApiError } from '../middleware/errorHandler';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { CONFIG } from '../utils/config';

/**
 * Register a new user
 * @route POST /api/users/register
 */
export const registerUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password, name, phone } = req.body;

    // Validate required fields
    if (!email || !password || !name) {
      throw new ApiError('Name, email, and password are required', 400);
    }

    // Validate email format
    if (!validateEmail(email)) {
      throw new ApiError('Invalid email format', 400);
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: new RegExp(`^${email}$`, 'i') },
        phone ? { phone } : { _id: null } // Only check phone if provided
      ]
    });

    if (existingUser) {
      throw new ApiError('User with this email or phone already exists', 400);
    }

    // Create new user (password will be hashed by pre-save hook)
    const newUser = new User({
      name,
      email,
      password,
      phone,
      role: rolesObj.USER,
      isActive: true, // New users are active by default, can be changed if approval is needed
    });

    await newUser.save();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Register a new admin user
 * @route POST /api/users/registerAdmin
 */
export const registerAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password, name, phone } = req.body;

    // Validate required fields
    if (!email || !password || !name) {
      throw new ApiError('Name, email, and password are required', 400);
    }

    // Validate email format
    if (!validateEmail(email)) {
      throw new ApiError('Invalid email format', 400);
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: new RegExp(`^${email}$`, 'i') },
        phone ? { phone } : { _id: null } // Only check phone if provided
      ]
    });

    if (existingUser) {
      throw new ApiError('User with this email or phone already exists', 400);
    }

    // Create new admin user (password will be hashed by pre-save hook)
    const newAdmin = new User({
      name,
      email,
      password,
      phone,
      role: rolesObj.ADMIN,
      isActive: true,
    });

    await newAdmin.save();

    res.status(201).json({
      success: true,
      message: 'Admin user registered successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * User login
 * @route POST /api/users/login
 */
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      throw new ApiError('Email and password are required', 400);
    }

    // Find user
    const user = await User.findOne({ email: new RegExp(`^${email}$`, 'i') });

    if (!user) {
      throw new ApiError('Invalid email or password', 401);
    }

    // Check if user is active
    if (!user.isActive) {
      throw new ApiError('Your account is inactive. Please contact an administrator.', 403);
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      throw new ApiError('Invalid email or password', 401);
    }

    // Generate tokens
    const accessToken = await generateAccessToken({
      userId: user._id.toString(),
      role: user.role,
      name: user.name,
      email: user.email,
      phone: user.phone,
    });

    const refreshToken = await generateRefreshToken({
      userId: user._id.toString(),
      role: user.role,
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin login
 * @route POST /api/users/loginAdmin
 */
export const loginAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      throw new ApiError('Email and password are required', 400);
    }

    // Find admin user
    const admin = await User.findOne({
      email: new RegExp(`^${email}$`, 'i'),
      role: rolesObj.ADMIN,
    });

    if (!admin) {
      throw new ApiError('Invalid email or password', 401);
    }

    // Verify password
    const isPasswordValid = await admin.comparePassword(password);

    if (!isPasswordValid) {
      throw new ApiError('Invalid email or password', 401);
    }

    // Generate tokens
    const accessToken = await generateAccessToken({
      userId: admin._id.toString(),
      role: admin.role,
      name: admin.name,
      email: admin.email,
    });

    const refreshToken = await generateRefreshToken({
      userId: admin._id.toString(),
      role: admin.role,
    });

    res.status(200).json({
      success: true,
      message: 'Admin login successful',
      accessToken,
      refreshToken,
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh token
 * @route POST /api/users/refreshToken
 */
export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new ApiError('Refresh token is required', 400);
    }

    // Verify the refresh token
    const decoded = jwt.verify(refreshToken, CONFIG.JWT_REFRESH_TOKEN_SECRET) as JwtPayload;

    if (!decoded || !decoded.userId) {
      throw new ApiError('Invalid refresh token', 401);
    }

    // Find the user
    const user = await User.findById(decoded.userId);

    if (!user) {
      throw new ApiError('User not found', 404);
    }

    if (!user.isActive) {
      throw new ApiError('User account is inactive', 403);
    }

    // Generate new tokens
    const newAccessToken = await generateAccessToken({
      userId: user._id.toString(),
      role: user.role,
      name: user.name,
      email: user.email,
      phone: user.phone,
    });

    const newRefreshToken = await generateRefreshToken({
      userId: user._id.toString(),
      role: user.role,
    });

    res.status(200).json({
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all users
 * @route GET /api/users
 */
export const getUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { role } = req.query;

    const query: any = {};

    // Filter by role if provided
    if (role) {
      query.role = role;
    }

    const users = await User.find(query).select('-password');

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user by ID
 * @route GET /api/users/:id
 */
export const getUserById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError('Invalid user ID', 400);
    }

    const user = await User.findById(id).select('-password');

    if (!user) {
      throw new ApiError('User not found', 404);
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user by ID
 * @route PATCH /api/users/:id
 */
export const updateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError('Invalid user ID', 400);
    }

    // Find user first to check if exists
    const user = await User.findById(id);

    if (!user) {
      throw new ApiError('User not found', 404);
    }

    // Handle password update specifically
    if (updates.password) {
      updates.password = await hashPassword(updates.password);
    } else {
      // Don't update password if not provided
      delete updates.password;
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user by ID
 * @route DELETE /api/users/:id
 */
export const deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError('Invalid user ID', 400);
    }

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      throw new ApiError('User not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 * @route GET /api/users/me
 */
export const getCurrentUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // User is already attached to request by auth middleware
    if (!req.user || !req.userObj) {
      throw new ApiError('Not authenticated', 401);
    }

    res.status(200).json({
      success: true,
      data: {
        id: req.userObj._id,
        name: req.userObj.name,
        email: req.userObj.email,
        role: req.userObj.role,
        phone: req.userObj.phone,
        isActive: req.userObj.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update current user profile
 * @route PATCH /api/users/me
 */
export const updateCurrentUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // User is already attached to request by auth middleware
    if (!req.user || !req.userObj) {
      throw new ApiError('Not authenticated', 401);
    }

    const userId = req.userObj._id;
    const updates = req.body;

    // Prevent changing role through this endpoint
    delete updates.role;

    // Handle password update specifically
    if (updates.password) {
      updates.password = await hashPassword(updates.password);
    } else {
      // Don't update password if not provided
      delete updates.password;
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};
