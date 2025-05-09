import Joi from 'joi';
import mongoose from 'mongoose';
import { rolesObj } from '../constants';

// Helper function to validate MongoDB ObjectId
const objectIdValidator = (value: string, helpers: Joi.CustomHelpers<any>) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error('any.invalid');
  }
  return value;
};

/**
 * Validation schema for user registration
 */
export const registerUserSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required()
    .messages({
      'string.base': 'Name must be a string',
      'string.empty': 'Name is required',
      'string.min': 'Name must be at least {#limit} characters',
      'string.max': 'Name cannot exceed {#limit} characters',
      'any.required': 'Name is required'
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

  phone: Joi.number().optional()
    .messages({
      'number.base': 'Phone must be a number'
    })
}).unknown(false);

/**
 * Validation schema for admin registration
 */
export const registerAdminSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required()
    .messages({
      'string.base': 'Name must be a string',
      'string.empty': 'Name is required',
      'string.min': 'Name must be at least {#limit} characters',
      'string.max': 'Name cannot exceed {#limit} characters',
      'any.required': 'Name is required'
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

  phone: Joi.number().optional()
    .messages({
      'number.base': 'Phone must be a number'
    }),

  role: Joi.string().valid(rolesObj.ADMIN).required()
    .messages({
      'string.base': 'Role must be a string',
      'string.empty': 'Role is required',
      'any.only': 'Role must be admin',
      'any.required': 'Role is required'
    })
}).unknown(false);

/**
 * Validation schema for user login
 */
export const loginSchema = Joi.object({
  email: Joi.string().email().required()
    .messages({
      'string.base': 'Email must be a string',
      'string.empty': 'Email is required',
      'string.email': 'Email must be a valid email address',
      'any.required': 'Email is required'
    }),

  password: Joi.string().required()
    .messages({
      'string.base': 'Password must be a string',
      'string.empty': 'Password is required',
      'any.required': 'Password is required'
    })
}).unknown(false);

/**
 * Validation schema for refresh token
 */
export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required()
    .messages({
      'string.base': 'Refresh token must be a string',
      'string.empty': 'Refresh token is required',
      'any.required': 'Refresh token is required'
    })
}).unknown(false);

/**
 * Validation schema for updating user
 */
export const updateUserSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100)
    .messages({
      'string.base': 'Name must be a string',
      'string.min': 'Name must be at least {#limit} characters',
      'string.max': 'Name cannot exceed {#limit} characters'
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

  phone: Joi.number().optional()
    .messages({
      'number.base': 'Phone must be a number'
    }),

  role: Joi.string().valid(...Object.values(rolesObj))
    .messages({
      'string.base': 'Role must be a string',
      'any.only': 'Role must be a valid role'
    }),

  isActive: Joi.boolean()
    .messages({
      'boolean.base': 'isActive must be a boolean'
    })
}).unknown(false);

/**
 * Validation schema for user ID parameter
 */
export const userIdParamSchema = Joi.object({
  id: Joi.string().custom(objectIdValidator).required()
    .messages({
      'string.base': 'User ID must be a string',
      'string.empty': 'User ID is required',
      'any.required': 'User ID is required',
      'any.invalid': 'User ID must be a valid ID'
    })
}).unknown(false);
