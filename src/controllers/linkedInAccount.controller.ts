import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import LinkedInAccount from '../models/LinkedInAccount.model';
import { badRequest, notFound, serverError, conflict } from '../helpers/ErrorHandler';
import { successResponse, dataResponse, paginatedResponse } from '../interfaces/ApiResponse';
import { ErrorMessages, SuccessMessages } from '../helpers/Constants';

// TODO: Implement and import encryption helpers
// import { encryptPassword, decryptPassword } from '../helpers/Encryption';

/**
 * Create a new LinkedIn account
 */
export const createLinkedInAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { name, password } = req.body;

  if (!name || !password) {
    return next(badRequest('Name (email) and password are required'));
  }

  try {
    // TODO: Encrypt password before saving
    const encryptedPassword = password; // Replace with await encryptPassword(password);

    const newAccount = new LinkedInAccount({
      name,
      password: encryptedPassword,
      createdBy: req.user?.id // Assuming authorizeJwt middleware attached user
    });

    await newAccount.save();

    // IMPORTANT: Do not return the password, even encrypted
    const accountData = newAccount.toJSON();
    delete accountData.password;

    res.status(201).json(dataResponse(SuccessMessages.LINKEDIN_ACCOUNT_CREATED, accountData));
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      return next(badRequest(error.message));
    }
    if (error.code === 11000) { // Handle duplicate name/email
      return next(conflict('LinkedIn account with this name/email already exists'));
    }
    next(serverError(error.message));
  }
};

/**
 * Get all LinkedIn accounts (paginated)
 */
export const getAllLinkedInAccounts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const accounts = await LinkedInAccount.find()
      .skip(skip)
      .limit(limit)
      .select('-password'); // Exclude password

    const total = await LinkedInAccount.countDocuments();

    res.status(200).json(paginatedResponse('LinkedIn accounts retrieved', accounts, {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    }));
  } catch (error: any) {
    next(serverError(error.message));
  }
};

/**
 * Get LinkedIn account by ID
 */
export const getLinkedInAccountById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(badRequest(ErrorMessages.INVALID_ID));
  }

  try {
    const account = await LinkedInAccount.findById(id).select('-password');
    if (!account) {
      return next(notFound(ErrorMessages.LINKEDIN_ACCOUNT_NOT_FOUND));
    }
    res.status(200).json(dataResponse('LinkedIn account found', account));
  } catch (error: any) {
    next(serverError(error.message));
  }
};

/**
 * Update LinkedIn account
 */
export const updateLinkedInAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  const updateData = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(badRequest(ErrorMessages.INVALID_ID));
  }

  try {
    // If password is being updated, encrypt it
    if (updateData.password) {
      // TODO: Encrypt password before saving
      updateData.password = updateData.password; // Replace with await encryptPassword(updateData.password);
    } else {
      // Don't allow password to be set to null/empty string accidentally
      delete updateData.password;
    }

    updateData.updatedBy = req.user?.id;

    const updatedAccount = await LinkedInAccount.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).select('-password');

    if (!updatedAccount) {
      return next(notFound(ErrorMessages.LINKEDIN_ACCOUNT_NOT_FOUND));
    }

    res.status(200).json(dataResponse(SuccessMessages.LINKEDIN_ACCOUNT_UPDATED, updatedAccount));
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      return next(badRequest(error.message));
    }
    if (error.code === 11000) { // Handle duplicate name/email
       return next(conflict('LinkedIn account with this name/email already exists'));
    }
    next(serverError(error.message));
  }
};

/**
 * Delete LinkedIn account
 */
export const deleteLinkedInAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(badRequest(ErrorMessages.INVALID_ID));
  }

  try {
    const deletedAccount = await LinkedInAccount.findByIdAndRemove(id);
    if (!deletedAccount) {
      return next(notFound(ErrorMessages.LINKEDIN_ACCOUNT_NOT_FOUND));
    }
    res.status(200).json(successResponse(SuccessMessages.LINKEDIN_ACCOUNT_DELETED));
  } catch (error: any) {
    next(serverError(error.message));
  }
};

/**
 * Verify LinkedIn account (placeholder - requires Selenium integration)
 */
export const verifyLinkedInAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  // TODO: Implement verification logic using Selenium
  // 1. Get account credentials (decrypt password)
  // 2. Attempt login using Selenium
  // 3. Update isValid/isBlocked status based on result
  console.log(`Verification requested for account ID: ${id}`);
  next(serverError('Verification not yet implemented'));
};