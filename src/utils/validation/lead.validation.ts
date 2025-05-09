import Joi from 'joi';
import mongoose from 'mongoose';
import { leadStatuses } from '../constants';

// Helper function to validate MongoDB ObjectId
const objectIdValidator = (value: string, helpers: Joi.CustomHelpers<any>) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error('any.invalid');
  }
  return value;
};

/**
 * Validation schema for lead ID parameter
 */
export const leadIdParamSchema = Joi.object({
  id: Joi.string().custom(objectIdValidator).required()
    .messages({
      'string.base': 'Lead ID must be a string',
      'string.empty': 'Lead ID is required',
      'any.required': 'Lead ID is required',
      'any.invalid': 'Lead ID must be a valid ID'
    })
}).unknown(false);

/**
 * Validation schema for leadId parameter
 */
export const leadIdParamAltSchema = Joi.object({
  leadId: Joi.string().custom(objectIdValidator).required()
    .messages({
      'string.base': 'Lead ID must be a string',
      'string.empty': 'Lead ID is required',
      'any.required': 'Lead ID is required',
      'any.invalid': 'Lead ID must be a valid ID'
    })
}).unknown(false);

/**
 * Validation schema for comment ID parameter
 */
export const commentIdParamSchema = Joi.object({
  commentId: Joi.string().custom(objectIdValidator).required()
    .messages({
      'string.base': 'Comment ID must be a string',
      'string.empty': 'Comment ID is required',
      'any.required': 'Comment ID is required',
      'any.invalid': 'Comment ID must be a valid ID'
    })
}).unknown(false);

/**
 * Validation schema for getting leads
 */
export const getLeadsSchema = Joi.object({
  campaignId: Joi.string().custom(objectIdValidator)
    .messages({
      'string.base': 'Campaign ID must be a string',
      'any.invalid': 'Campaign ID must be a valid ID'
    }),

  status: Joi.string().valid(...Object.values(leadStatuses))
    .messages({
      'string.base': 'Status must be a string',
      'any.only': 'Status must be valid'
    }),

  isSearched: Joi.boolean()
    .messages({
      'boolean.base': 'isSearched must be a boolean'
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

  sortBy: Joi.string().valid('createdAt', 'updatedAt', 'name', 'status').default('createdAt')
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

/**
 * Validation schema for updating a lead
 */
export const updateLeadSchema = Joi.object({
  status: Joi.string().valid(...Object.values(leadStatuses))
    .messages({
      'string.base': 'Status must be a string',
      'any.only': 'Status must be valid'
    }),

  rating: Joi.string()
    .messages({
      'string.base': 'Rating must be a string'
    }),

  name: Joi.string().trim()
    .messages({
      'string.base': 'Name must be a string'
    }),

  headline: Joi.string().trim()
    .messages({
      'string.base': 'Headline must be a string'
    }),

  location: Joi.string().trim()
    .messages({
      'string.base': 'Location must be a string'
    }),

  leadAssignedToId: Joi.string().custom(objectIdValidator).allow(null)
    .messages({
      'string.base': 'Assigned user ID must be a string',
      'any.invalid': 'Assigned user ID must be a valid ID'
    })
}).unknown(false);

/**
 * Validation schema for creating a lead comment
 */
export const createLeadCommentSchema = Joi.object({
  comment: Joi.string().trim().required()
    .messages({
      'string.base': 'Comment must be a string',
      'string.empty': 'Comment is required',
      'any.required': 'Comment is required'
    })
}).unknown(false);

/**
 * Validation schema for updating a lead comment
 */
export const updateLeadCommentSchema = Joi.object({
  comment: Joi.string().trim().required()
    .messages({
      'string.base': 'Comment must be a string',
      'string.empty': 'Comment is required',
      'any.required': 'Comment is required'
    })
}).unknown(false);
