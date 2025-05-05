import Joi from 'joi';
import { CampaignStatus } from '../../models/campaign.model';
import mongoose from 'mongoose';

// Helper function to validate MongoDB ObjectId
const objectIdValidator = (value: string, helpers: Joi.CustomHelpers<any>) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error('any.invalid');
  }
  return value;
};

/**
 * Validation schema for creating a new campaign
 */
export const createCampaignSchema = Joi.object({
  name: Joi.string().trim().min(3).max(100).required()
    .messages({
      'string.base': 'Campaign name must be a string',
      'string.empty': 'Campaign name is required',
      'string.min': 'Campaign name must be at least {#limit} characters',
      'string.max': 'Campaign name cannot exceed {#limit} characters',
      'any.required': 'Campaign name is required'
    }),

  searchQuery: Joi.string().trim().required()
    .messages({
      'string.base': 'Search query must be a string',
      'string.empty': 'Search query is required',
      'any.required': 'Search query is required'
    }),

  // Optional search parameters
  school: Joi.string().trim().allow('', null),
  company: Joi.string().trim().allow('', null),
  pastCompany: Joi.string().trim().allow('', null),
  location: Joi.string().trim().allow('', null),
  industry: Joi.string().trim().allow('', null),
  connectionDegree: Joi.string().valid('1st', '2nd', '3rd', 'All').default('2nd'),
  keywords: Joi.array().items(Joi.string().trim()),

  // Required references
  linkedinAccountId: Joi.string().custom(objectIdValidator).required()
    .messages({
      'string.base': 'LinkedIn account ID must be a string',
      'string.empty': 'LinkedIn account ID is required',
      'any.required': 'LinkedIn account ID is required',
      'any.invalid': 'LinkedIn account ID must be a valid ID'
    }),

  proxyId: Joi.string().custom(objectIdValidator).required()
    .messages({
      'string.base': 'Proxy ID must be a string',
      'string.empty': 'Proxy ID is required',
      'any.required': 'Proxy ID is required',
      'any.invalid': 'Proxy ID must be a valid ID'
    }),

  // Optional scheduling and advanced config
  scheduledFor: Joi.date().iso().min('now').allow(null),
  searchFilters: Joi.object().allow(null),

  maxResults: Joi.number().integer().min(1).max(1000).default(100)
    .messages({
      'number.base': 'Maximum results must be a number',
      'number.integer': 'Maximum results must be an integer',
      'number.min': 'Maximum results must be at least {#limit}',
      'number.max': 'Maximum results cannot exceed {#limit}'
    })
}).unknown(false); // This will force strict validation with only the fields specified

/**
 * Validation schema for updating an existing campaign
 */
export const updateCampaignSchema = Joi.object({
  name: Joi.string().trim().min(3).max(100)
    .messages({
      'string.base': 'Campaign name must be a string',
      'string.min': 'Campaign name must be at least {#limit} characters',
      'string.max': 'Campaign name cannot exceed {#limit} characters'
    }),

  searchQuery: Joi.string().trim()
    .messages({
      'string.base': 'Search query must be a string'
    }),

  // Optional search parameters
  school: Joi.string().trim().allow('', null),
  company: Joi.string().trim().allow('', null),
  pastCompany: Joi.string().trim().allow('', null),
  location: Joi.string().trim().allow('', null),
  industry: Joi.string().trim().allow('', null),
  connectionDegree: Joi.string().valid('1st', '2nd', '3rd', 'All'),
  keywords: Joi.array().items(Joi.string().trim()),

  // References
  linkedinAccountId: Joi.string().custom(objectIdValidator)
    .messages({
      'string.base': 'LinkedIn account ID must be a string',
      'any.invalid': 'LinkedIn account ID must be a valid ID'
    }),

  proxyId: Joi.string().custom(objectIdValidator)
    .messages({
      'string.base': 'Proxy ID must be a string',
      'any.invalid': 'Proxy ID must be a valid ID'
    }),

  // Status fields
  status: Joi.string().valid(...Object.values(CampaignStatus)),

  // Optional scheduling and advanced config
  scheduledFor: Joi.date().iso().min('now').allow(null),
  searchFilters: Joi.object().allow(null),

  maxResults: Joi.number().integer().min(1).max(1000)
    .messages({
      'number.base': 'Maximum results must be a number',
      'number.integer': 'Maximum results must be an integer',
      'number.min': 'Maximum results must be at least {#limit}',
      'number.max': 'Maximum results cannot exceed {#limit}'
    })
}).unknown(false); // Force strict validation

/**
 * Validation schema for adding a campaign to execution queue
 */
export const queueCampaignSchema = Joi.object({
  campaignId: Joi.string().custom(objectIdValidator).required()
    .messages({
      'string.base': 'Campaign ID must be a string',
      'string.empty': 'Campaign ID is required',
      'any.required': 'Campaign ID is required',
      'any.invalid': 'Campaign ID must be a valid ID'
    }),

  scheduledFor: Joi.date().iso().min('now').allow(null),

  priority: Joi.string().valid('low', 'medium', 'high').default('medium')
}).unknown(false); // Force strict validation

/**
 * Validation schema for filtering campaigns
 */
export const campaignFilterSchema = Joi.object({
  status: Joi.string().valid(...Object.values(CampaignStatus)),
  isSearched: Joi.boolean(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string().valid('createdAt', 'updatedAt', 'name', 'status').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
}).unknown(true); // Allow additional query params
