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
 * Validation schema for testing LinkedIn login
 */
export const testLoginSchema = Joi.object({
  accountId: Joi.string().custom(objectIdValidator)
    .messages({
      'string.base': 'Account ID must be a string',
      'any.invalid': 'Account ID must be a valid ID'
    }),

  proxyId: Joi.string().custom(objectIdValidator)
    .messages({
      'string.base': 'Proxy ID must be a string',
      'any.invalid': 'Proxy ID must be a valid ID'
    }),

  username: Joi.string().trim()
    .messages({
      'string.base': 'Username must be a string'
    }),

  email: Joi.string().email()
    .messages({
      'string.base': 'Email must be a string',
      'string.email': 'Email must be a valid email address'
    }),

  password: Joi.string()
    .messages({
      'string.base': 'Password must be a string'
    })
}).unknown(false);

/**
 * Validation schema for searching LinkedIn profiles
 */
export const searchProfilesSchema = Joi.object({
  keywords: Joi.alternatives().try(
    Joi.string().trim(),
    Joi.array().items(Joi.string().trim())
  ).required()
    .messages({
      'string.base': 'Keywords must be a string or array of strings',
      'string.empty': 'Keywords cannot be empty',
      'any.required': 'Keywords are required'
    }),

  filters: Joi.object({
    locations: Joi.array().items(Joi.string().trim()).allow(null),
    companies: Joi.array().items(Joi.string().trim()).allow(null),
    pastCompanies: Joi.array().items(Joi.string().trim()).allow(null),
    schools: Joi.array().items(Joi.string().trim()).allow(null),
    industries: Joi.array().items(Joi.string().trim()).allow(null),
    connectionDegree: Joi.array().items(Joi.string().valid('1st', '2nd', '3rd', 'All')).allow(null)
  }),

  maxResults: Joi.number().integer().min(1).max(1000).default(100)
    .messages({
      'number.base': 'Maximum results must be a number',
      'number.integer': 'Maximum results must be an integer',
      'number.min': 'Maximum results must be at least {#limit}',
      'number.max': 'Maximum results cannot exceed {#limit}'
    }),

  accountId: Joi.string().custom(objectIdValidator)
    .messages({
      'string.base': 'Account ID must be a string',
      'any.invalid': 'Account ID must be a valid ID'
    }),

  proxyId: Joi.string().custom(objectIdValidator)
    .messages({
      'string.base': 'Proxy ID must be a string',
      'any.invalid': 'Proxy ID must be a valid ID'
    }),

  campaignId: Joi.string().custom(objectIdValidator)
    .messages({
      'string.base': 'Campaign ID must be a string',
      'any.invalid': 'Campaign ID must be a valid ID'
    })
}).unknown(false);

/**
 * Validation schema for getting next available LinkedIn account
 */
export const getNextAccountSchema = Joi.object({
  excludeIds: Joi.array().items(Joi.string().custom(objectIdValidator))
    .messages({
      'array.base': 'Exclude IDs must be an array',
      'any.invalid': 'Exclude IDs must contain valid IDs'
    })
}).unknown(true);

/**
 * Validation schema for getting next available proxy
 */
export const getNextProxySchema = Joi.object({
  excludeIds: Joi.array().items(Joi.string().custom(objectIdValidator))
    .messages({
      'array.base': 'Exclude IDs must be an array',
      'any.invalid': 'Exclude IDs must contain valid IDs'
    }),

  type: Joi.string().valid('http', 'https', 'socks4', 'socks5')
    .messages({
      'string.base': 'Type must be a string',
      'any.only': 'Type must be one of "http", "https", "socks4", or "socks5"'
    })
}).unknown(true);
