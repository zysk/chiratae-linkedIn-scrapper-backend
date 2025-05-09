import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ApiError } from '../utils/error.utils';

/**
 * Validation middleware
 * @param schema - Joi validation schema
 * @param property - Request property to validate ('body', 'query', 'params')
 * @returns Express middleware function
 */
export const validate = (schema: Joi.Schema, property: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false, // Include all errors
      stripUnknown: false, // Don't remove unknown properties
      allowUnknown: property === 'query', // Allow unknown query params, but be strict with body and params
    });

    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(', ');

      next(new ApiError(errorMessage, 400));
      return;
    }

    // Replace with validated data
    req[property] = value;
    next();
  };
};
