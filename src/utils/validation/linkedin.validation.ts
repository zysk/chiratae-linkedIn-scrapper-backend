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
 * Validation schema for campaign ID parameter
 */
export const campaignIdParamSchema = Joi.object({
  id: Joi.string().custom(objectIdValidator).required()
    .messages({
      'string.base': 'Campaign ID must be a string',
      'string.empty': 'Campaign ID is required',
      'any.required': 'Campaign ID is required',
      'any.invalid': 'Campaign ID must be a valid MongoDB ID'
    })
});

/**
 * Validation schema for LinkedIn profile URL
 */
export const profileScrapeSchema = Joi.object({
  profileUrl: Joi.string()
    .required()
    .pattern(/^https?:\/\/([a-z]{2,3}\.)?linkedin\.com\/in\/[a-zA-Z0-9\-_%]{5,100}\/?.*$/)
    .messages({
      'string.pattern.base': 'Invalid LinkedIn profile URL format. Should be like: https://linkedin.com/in/username'
    }),
});

/**
 * Validation schema for LinkedIn login credentials
 */
export const linkedinLoginSchema = Joi.object({
  username: Joi.string().required().messages({
    'string.empty': 'Username is required'
  }),
  password: Joi.string().required().messages({
    'string.empty': 'Password is required'
  }),
});

/**
 * Validation schema for LinkedIn search parameters
 */
export const linkedinSearchSchema = Joi.object({
  keywords: Joi.string().allow('').optional(),
  company: Joi.string().allow('').optional(),
  location: Joi.string().allow('').optional(),
  pastCompany: Joi.string().allow('').optional(),
  industry: Joi.string().allow('').optional(),
  connectionDegree: Joi.string().allow('').optional(),
  maxResults: Joi.number().integer().min(1).max(1000).default(50),

  // Proxy fields - all optional
  proxyHost: Joi.string().optional(),
  proxyPort: Joi.number().integer().min(1).max(65535).optional(),
  proxyUsername: Joi.string().optional(),
  proxyPassword: Joi.string().optional()
}).messages({
  'number.base': '{{#label}} must be a number',
  'number.integer': '{{#label}} must be an integer',
  'number.min': '{{#label}} must be at least {{#limit}}',
  'number.max': '{{#label}} must be at most {{#limit}}'
});
