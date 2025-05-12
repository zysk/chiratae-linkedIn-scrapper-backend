import Joi from 'joi';
import mongoose from 'mongoose';
import { CampaignPriority, CampaignRecurrence, CampaignStatus } from '../../models/campaign.model';

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

  proxyId: Joi.string().custom(objectIdValidator).allow(null)
    .messages({
      'string.base': 'Proxy ID must be a string',
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

/**
 * Validation schema for scheduling a campaign
 */
export const scheduleCampaignSchema = Joi.object({
  scheduleDate: Joi.date().iso().min('now').required()
    .messages({
      'date.base': 'Schedule date must be a valid date',
      'date.format': 'Schedule date must be in ISO format (DD-MM-YYYY THH:mm:ss.sssZ)',
      'date.min': 'Schedule date must be in the future',
      'any.required': 'Schedule date is required'
    }),

  jobType: Joi.string().valid('search', 'profile_scraping').required()
    .messages({
      'string.base': 'Job type must be a string',
      'string.empty': 'Job type is required',
      'any.required': 'Job type is required',
      'any.only': 'Job type must be either "search" or "profile_scraping"'
    }),

  priority: Joi.string().valid(...Object.values(CampaignPriority)).default(CampaignPriority.MEDIUM)
    .messages({
      'string.base': 'Priority must be a string',
      'any.only': 'Priority must be one of "low", "medium", or "high"'
    }),

  recurrence: Joi.string().valid(...Object.values(CampaignRecurrence)).default(CampaignRecurrence.ONCE)
    .messages({
      'string.base': 'Recurrence must be a string',
      'any.only': 'Recurrence must be one of "once", "daily", "weekly", or "monthly"'
    }),

  endDate: Joi.date().iso().min(Joi.ref('scheduleDate')).allow(null)
    .messages({
      'date.base': 'End date must be a valid date',
      'date.format': 'End date must be in ISO format (DD-MM-YYYY THH:mm:ss.sssZ)',
      'date.min': 'End date must be after the schedule date'
    })
}).unknown(false); // Force strict validation
