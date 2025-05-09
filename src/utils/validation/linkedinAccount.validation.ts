import Joi from 'joi';
import mongoose from 'mongoose';

// Helper function to validate MongoDB ObjectId
const objectIdValidator = (value: string, helpers: Joi.CustomHelpers<any>) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error('any.invalid');
  }
  return value;
};

/**
 * Validation schema for creating a LinkedIn account
 */
export const createLinkedinAccountSchema = Joi.object({
  username: Joi.string().trim().required()
    .messages({
      'string.base': 'Username must be a string',
      'string.empty': 'Username is required',
      'any.required': 'Username is required'
    }),

  email: Joi.string().email().required()
    .messages({
      'string.base': 'Email must be a string',
      'string.empty': 'Email is required',
      'string.email': 'Email must be a valid email address',
      'any.required': 'Email is required'
    }),

  password: Joi.string().min(8).required()
    .messages({
      'string.base': 'Password must be a string',
      'string.empty': 'Password is required',
      'string.min': 'Password must be at least {#limit} characters',
      'any.required': 'Password is required'
    }),

  isActive: Joi.boolean().default(true)
    .messages({
      'boolean.base': 'isActive must be a boolean'
    }),

  dailyRequestLimit: Joi.number().integer().min(1).max(1000).default(100)
    .messages({
      'number.base': 'Daily request limit must be a number',
      'number.integer': 'Daily request limit must be an integer',
      'number.min': 'Daily request limit must be at least {#limit}',
      'number.max': 'Daily request limit cannot exceed {#limit}'
    }),

  notes: Joi.string().trim().allow('', null)
    .messages({
      'string.base': 'Notes must be a string'
    })
}).unknown(false);

/**
 * Validation schema for updating a LinkedIn account
 */
export const updateLinkedinAccountSchema = Joi.object({
  username: Joi.string().trim()
    .messages({
      'string.base': 'Username must be a string'
    }),

  email: Joi.string().email()
    .messages({
      'string.base': 'Email must be a string',
      'string.email': 'Email must be a valid email address'
    }),

  password: Joi.string().min(8)
    .messages({
      'string.base': 'Password must be a string',
      'string.min': 'Password must be at least {#limit} characters'
    }),

  isActive: Joi.boolean()
    .messages({
      'boolean.base': 'isActive must be a boolean'
    }),

  dailyRequestLimit: Joi.number().integer().min(1).max(1000)
    .messages({
      'number.base': 'Daily request limit must be a number',
      'number.integer': 'Daily request limit must be an integer',
      'number.min': 'Daily request limit must be at least {#limit}',
      'number.max': 'Daily request limit cannot exceed {#limit}'
    }),

  notes: Joi.string().trim().allow('', null)
    .messages({
      'string.base': 'Notes must be a string'
    }),

  requestsMade: Joi.number().integer().min(0)
    .messages({
      'number.base': 'Requests made must be a number',
      'number.integer': 'Requests made must be an integer',
      'number.min': 'Requests made must be at least {#limit}'
    }),

  lastReset: Joi.date()
    .messages({
      'date.base': 'Last reset must be a valid date'
    })
}).unknown(false);

/**
 * Validation schema for LinkedIn account ID parameter
 */
export const linkedinAccountIdParamSchema = Joi.object({
  id: Joi.string().custom(objectIdValidator).required()
    .messages({
      'string.base': 'LinkedIn account ID must be a string',
      'string.empty': 'LinkedIn account ID is required',
      'any.required': 'LinkedIn account ID is required',
      'any.invalid': 'LinkedIn account ID must be a valid ID'
    })
}).unknown(false);

/**
 * Validation schema for listing LinkedIn accounts
 */
export const listLinkedinAccountsSchema = Joi.object({
  isActive: Joi.boolean()
    .messages({
      'boolean.base': 'isActive must be a boolean'
    }),

  page: Joi.number().integer().min(1).default(1)
    .messages({
      'number.base': 'Page must be a number',
      'number.integer': 'Page must be an integer',
      'number.min': 'Page must be at least {#limit}'
    }),

  limit: Joi.number().integer().min(1).max(100).default(10)
    .messages({
      'number.base': 'Limit must be a number',
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least {#limit}',
      'number.max': 'Limit cannot exceed {#limit}'
    }),

  sortBy: Joi.string().valid('createdAt', 'updatedAt', 'username', 'requestsMade').default('createdAt')
    .messages({
      'string.base': 'Sort by must be a string',
      'any.only': 'Sort by must be a valid field'
    }),

  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
    .messages({
      'string.base': 'Sort order must be a string',
      'any.only': 'Sort order must be either "asc" or "desc"'
    })
}).unknown(true);
