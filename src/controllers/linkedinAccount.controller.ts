import { Request, Response, NextFunction } from 'express';
import LinkedInAccount, { ILinkedInAccount } from '../models/linkedinAccount.model';
import { ApiError } from '../middleware/errorHandler';
import { LinkedInAccountManager } from '../utils/proxy.utils';

/**
 * Create a new LinkedIn account
 * @route POST /api/linkedin-accounts
 * @access Private/Admin
 */
export const createLinkedInAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { username, password, email, description } = req.body;

    // Validate required fields
    if (!username || !password) {
      throw new ApiError('Username and password are required', 400);
    }

    // Check if account already exists
    const existingAccount = await LinkedInAccount.findOne({
      username
    });

    if (existingAccount) {
      throw new ApiError('LinkedIn account with this username already exists', 400);
    }

    // Create new account
    const newAccount = new LinkedInAccount({
      username,
      email,
      description,
      createdBy: req.user!.userId,
    });

    // Set password securely
    newAccount.setPassword(password);

    // Save to database
    await newAccount.save();

    // Reset manager cache to include the new account
    LinkedInAccountManager.getInstance().resetCache();

    res.status(201).json({
      success: true,
      message: 'LinkedIn account created successfully',
      data: {
        id: newAccount._id,
        username: newAccount.username,
        email: newAccount.email,
        description: newAccount.description,
        createdAt: newAccount.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all LinkedIn accounts
 * @route GET /api/linkedin-accounts
 * @access Private/Admin
 */
export const getLinkedInAccounts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const total = await LinkedInAccount.countDocuments();

    // Get accounts with pagination
    const accounts = await LinkedInAccount.find()
      .select('-encryptedPassword')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'LinkedIn accounts retrieved successfully',
      data: accounts,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a LinkedIn account by ID
 * @route GET /api/linkedin-accounts/:id
 * @access Private/Admin
 */
export const getLinkedInAccountById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const accountId = req.params.id;

    const account = await LinkedInAccount.findById(accountId)
      .select('-encryptedPassword')
      .populate('createdBy', 'name email');

    if (!account) {
      throw new ApiError('LinkedIn account not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'LinkedIn account retrieved successfully',
      data: account,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a LinkedIn account
 * @route PUT /api/linkedin-accounts/:id
 * @access Private/Admin
 */
export const updateLinkedInAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const accountId = req.params.id;
    const { username, password, email, description, isActive } = req.body;

    // Find account
    const account = await LinkedInAccount.findById(accountId);

    if (!account) {
      throw new ApiError('LinkedIn account not found', 404);
    }

    // Update fields if provided
    if (username) account.username = username;
    if (email !== undefined) account.email = email;
    if (description !== undefined) account.description = description;
    if (isActive !== undefined) account.isActive = isActive;

    // Set password securely if provided
    if (password) {
      account.setPassword(password);
    }

    // Save changes
    await account.save();

    // Reset manager cache to reflect changes
    LinkedInAccountManager.getInstance().resetCache();

    res.status(200).json({
      success: true,
      message: 'LinkedIn account updated successfully',
      data: {
        id: account._id,
        username: account.username,
        email: account.email,
        description: account.description,
        isActive: account.isActive,
        updatedAt: account.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a LinkedIn account
 * @route DELETE /api/linkedin-accounts/:id
 * @access Private/Admin
 */
export const deleteLinkedInAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const accountId = req.params.id;

    const account = await LinkedInAccount.findByIdAndDelete(accountId);

    if (!account) {
      throw new ApiError('LinkedIn account not found', 404);
    }

    // Reset manager cache to reflect changes
    LinkedInAccountManager.getInstance().resetCache();

    res.status(200).json({
      success: true,
      message: 'LinkedIn account deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get next available LinkedIn account (for internal use)
 * @route GET /api/linkedin-accounts/next
 * @access Private/Admin
 */
export const getNextAvailableAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const account = await LinkedInAccountManager.getInstance().getNextAccount();

    if (!account) {
      throw new ApiError('No active LinkedIn accounts available', 404);
    }

    // Get the password
    const password = account.getPassword();

    res.status(200).json({
      success: true,
      message: 'Next available LinkedIn account retrieved',
      data: {
        id: account._id,
        username: account.username,
        password: password,
        email: account.email,
      },
    });
  } catch (error) {
    next(error);
  }
};
