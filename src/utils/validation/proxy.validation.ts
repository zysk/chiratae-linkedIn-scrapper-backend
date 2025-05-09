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
 * Validation schema for creating a proxy
 */
export const createProxySchema = Joi.object({
  name: Joi.string().trim().required()
    .messages({
      'string.base': 'Name must be a string',
      'string.empty': 'Name is required',
      'any.required': 'Name is required'
    }),

  host: Joi.string().trim().required()
    .messages({
      'string.base': 'Host must be a string',
      'string.empty': 'Host is required',
      'any.required': 'Host is required'
    }),

  port: Joi.number().integer().min(1).max(65535).required()
    .messages({
      'number.base': 'Port must be a number',
      'number.integer': 'Port must be an integer',
      'number.min': 'Port must be at least {#limit}',
      'number.max': 'Port cannot exceed {#limit}',
      'any.required': 'Port is required'
    }),

  username: Joi.string().trim().allow('', null)
    .messages({
      'string.base': 'Username must be a string'
    }),

  password: Joi.string().allow('', null)
    .messages({
      'string.base': 'Password must be a string'
    }),

  isActive: Joi.boolean().default(true)
    .messages({
      'boolean.base': 'isActive must be a boolean'
    }),

  type: Joi.string().valid('http', 'https', 'socks4', 'socks5').default('http')
    .messages({
      'string.base': 'Type must be a string',
      'any.only': 'Type must be one of "http", "https", "socks4", or "socks5"'
    }),

  location: Joi.string().trim().allow('', null)
    .messages({
      'string.base': 'Location must be a string'
    }),

  notes: Joi.string().trim().allow('', null)
    .messages({
      'string.base': 'Notes must be a string'
    })
}).unknown(false);

/**
 * Validation schema for updating a proxy
 */
export const updateProxySchema = Joi.object({
  name: Joi.string().trim()
    .messages({
      'string.base': 'Name must be a string'
    }),

  host: Joi.string().trim()
    .messages({
      'string.base': 'Host must be a string'
    }),

  port: Joi.number().integer().min(1).max(65535)
    .messages({
      'number.base': 'Port must be a number',
      'number.integer': 'Port must be an integer',
      'number.min': 'Port must be at least {#limit}',
      'number.max': 'Port cannot exceed {#limit}'
    }),

  username: Joi.string().trim().allow('', null)
    .messages({
      'string.base': 'Username must be a string'
    }),

  password: Joi.string().allow('', null)
    .messages({
      'string.base': 'Password must be a string'
    }),

  isActive: Joi.boolean()
    .messages({
      'boolean.base': 'isActive must be a boolean'
    }),

  type: Joi.string().valid('http', 'https', 'socks4', 'socks5')
    .messages({
      'string.base': 'Type must be a string',
      'any.only': 'Type must be one of "http", "https", "socks4", or "socks5"'
    }),

  location: Joi.string().trim().allow('', null)
    .messages({
      'string.base': 'Location must be a string'
    }),

  notes: Joi.string().trim().allow('', null)
    .messages({
      'string.base': 'Notes must be a string'
    })
}).unknown(false);

/**
 * Validation schema for proxy ID parameter
 */
export const proxyIdParamSchema = Joi.object({
  id: Joi.string().custom(objectIdValidator).required()
    .messages({
      'string.base': 'Proxy ID must be a string',
      'string.empty': 'Proxy ID is required',
      'any.required': 'Proxy ID is required',
      'any.invalid': 'Proxy ID must be a valid ID'
    })
}).unknown(false);

/**
 * Validation schema for listing proxies
 */
export const listProxiesSchema = Joi.object({
  isActive: Joi.boolean()
    .messages({
      'boolean.base': 'isActive must be a boolean'
    }),

  type: Joi.string().valid('http', 'https', 'socks4', 'socks5')
    .messages({
      'string.base': 'Type must be a string',
      'any.only': 'Type must be one of "http", "https", "socks4", or "socks5"'
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

  sortBy: Joi.string().valid('createdAt', 'updatedAt', 'name', 'type').default('createdAt')
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
