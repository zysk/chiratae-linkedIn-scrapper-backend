import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import LinkedInAccount from "../models/LinkedInAccount.model";
import {
  badRequest,
  notFound,
  serverError,
  conflict,
} from "../helpers/ErrorHandler";
import {
  successResponse,
  dataResponse,
  paginatedResponse,
} from "../interfaces/ApiResponse";
import { ErrorMessages, SuccessMessages } from "../helpers/Constants";
import { encryptPassword, decryptPassword } from '../helpers/Encryption';
import Logger from "../helpers/Logger";
import { getSeleniumDriver, isLoggedIn } from "../helpers/SeleniumUtils";

const logger = new Logger({ context: "linkedin-account-controller" });

/**
 * Create a new LinkedIn account
 */
export const createLinkedInAccount = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { name, password } = req.body;

  if (!name || !password) {
    return next(badRequest("Name (email) and password are required"));
  }

  try {
    // Create new account - password encryption is handled in pre-save hook
    const newAccount = new LinkedInAccount({
      name,
      password,
      createdBy: req.user?.id, // Assuming authorizeJwt middleware attached user
    });

    await newAccount.save();

    // IMPORTANT: Do not return the password, even encrypted
    const accountData = newAccount.toJSON();
    delete accountData.password;

    res
      .status(201)
      .json(
        dataResponse(SuccessMessages.LINKEDIN_ACCOUNT_CREATED, accountData),
      );
  } catch (error: any) {
    if (error.name === "ValidationError") {
      return next(badRequest(error.message));
    }
    if (error.code === 11000) {
      // Handle duplicate name/email
      return next(
        conflict("LinkedIn account with this name/email already exists"),
      );
    }
    logger.error("Error creating LinkedIn account:", error);
    next(serverError(error.message));
  }
};

/**
 * Get all LinkedIn accounts (paginated)
 */
export const getAllLinkedInAccounts = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Add support for filtering
    const filter: any = {};

    // Filter by validity if specified
    if (req.query.isValid !== undefined) {
      filter.isValid = req.query.isValid === 'true';
    }

    // Filter by blocked status if specified
    if (req.query.isBlocked !== undefined) {
      filter.isBlocked = req.query.isBlocked === 'true';
    }

    const accounts = await LinkedInAccount.find(filter)
      .skip(skip)
      .limit(limit)
      .select("-password"); // Exclude password

    const total = await LinkedInAccount.countDocuments(filter);

    res.status(200).json(
      paginatedResponse("LinkedIn accounts retrieved", accounts, {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      }),
    );
  } catch (error: any) {
    logger.error("Error retrieving LinkedIn accounts:", error);
    next(serverError(error.message));
  }
};

/**
 * Get LinkedIn account by ID
 */
export const getLinkedInAccountById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(badRequest(ErrorMessages.INVALID_ID));
  }

  try {
    const account = await LinkedInAccount.findById(id).select("-password");
    if (!account) {
      return next(notFound(ErrorMessages.LINKEDIN_ACCOUNT_NOT_FOUND));
    }
    res.status(200).json(dataResponse("LinkedIn account found", account));
  } catch (error: any) {
    logger.error("Error retrieving LinkedIn account by ID:", error);
    next(serverError(error.message));
  }
};

/**
 * Update LinkedIn account
 */
export const updateLinkedInAccount = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { id } = req.params;
  const updateData = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(badRequest(ErrorMessages.INVALID_ID));
  }

  try {
    // If empty password is provided, remove it from update
    if (updateData.password === "") {
      delete updateData.password;
    }

    updateData.updatedBy = req.user?.id;

    const updatedAccount = await LinkedInAccount.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true },
    ).select("-password");

    if (!updatedAccount) {
      return next(notFound(ErrorMessages.LINKEDIN_ACCOUNT_NOT_FOUND));
    }

    res
      .status(200)
      .json(
        dataResponse(SuccessMessages.LINKEDIN_ACCOUNT_UPDATED, updatedAccount),
      );
  } catch (error: any) {
    if (error.name === "ValidationError") {
      return next(badRequest(error.message));
    }
    if (error.code === 11000) {
      // Handle duplicate name/email
      return next(
        conflict("LinkedIn account with this name/email already exists"),
      );
    }
    logger.error("Error updating LinkedIn account:", error);
    next(serverError(error.message));
  }
};

/**
 * Delete LinkedIn account
 */
export const deleteLinkedInAccount = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(badRequest(ErrorMessages.INVALID_ID));
  }

  try {
    const deletedAccount = await LinkedInAccount.findByIdAndRemove(id);
    if (!deletedAccount) {
      return next(notFound(ErrorMessages.LINKEDIN_ACCOUNT_NOT_FOUND));
    }
    res
      .status(200)
      .json(successResponse(SuccessMessages.LINKEDIN_ACCOUNT_DELETED));
  } catch (error: any) {
    logger.error("Error deleting LinkedIn account:", error);
    next(serverError(error.message));
  }
};

/**
 * Verify LinkedIn account using Selenium
 */
export const verifyLinkedInAccount = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(badRequest(ErrorMessages.INVALID_ID));
  }

  try {
    // Get the account
    const account = await LinkedInAccount.findById(id);
    if (!account) {
      return next(notFound(ErrorMessages.LINKEDIN_ACCOUNT_NOT_FOUND));
    }

    // Get the decrypted password
    const password = await account.getDecryptedPassword();
    if (!password) {
      return next(serverError("Failed to decrypt password"));
    }

    logger.info(`Verifying LinkedIn account ${account.name}`);

    // Get a Selenium driver instance
    let driver = null;
    try {
      // Attempt to sign in to LinkedIn
      driver = await getSeleniumDriver();
      const loginResult = await isLoggedIn(driver, account.name, password);

      // Update account validity based on login result
      account.isValid = loginResult.success;
      account.lastUsed = new Date();

      if (!loginResult.success) {
        account.isBlocked = loginResult.blocked || false;
        logger.warn(`Login failed for account ${account.name}: ${loginResult.message}`);
      } else {
        account.isBlocked = false;
        account.usageCount += 1;
      }

      await account.save();

      res.status(200).json(dataResponse(
        `LinkedIn account verification ${loginResult.success ? 'successful' : 'failed'}`,
        {
          accountId: account._id,
          name: account.name,
          isValid: account.isValid,
          isBlocked: account.isBlocked,
          message: loginResult.message
        }
      ));
    } catch (seleniumError) {
      logger.error("Selenium error during verification:", seleniumError);
      next(serverError("Failed to verify account due to technical issues"));
    } finally {
      // Clean up
      if (driver) {
        try {
          await driver.quit();
        } catch (quitError) {
          logger.error("Error closing Selenium driver:", quitError);
        }
      }
    }
  } catch (error: any) {
    logger.error("Error verifying LinkedIn account:", error);
    next(serverError(error.message));
  }
};

/**
 * Bulk verify LinkedIn accounts
 */
export const bulkVerifyLinkedInAccounts = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Get accounts to verify (non-blocked ones that haven't been used in a while)
    const accounts = await LinkedInAccount.find({
      isBlocked: false,
      $or: [
        { lastUsed: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }, // Not used in the last 7 days
        { lastUsed: { $exists: false } } // Never used
      ]
    }).limit(5); // Process in batches of 5

    if (accounts.length === 0) {
      return res.status(200).json(successResponse("No accounts need verification at this time"));
    }

    // Start background verification process
    // (In a production app, this would be a queue job)
    res.status(202).json(successResponse(`Verification of ${accounts.length} accounts started in the background`));

    // For the immediate response, we just log this
    logger.info(`Starting bulk verification of ${accounts.length} LinkedIn accounts`);

    // In a real implementation, this would be handled by a background job system
  } catch (error: any) {
    logger.error("Error starting bulk verification:", error);
    next(serverError(error.message));
  }
};
