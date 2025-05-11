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
  linkedinAccountId: Joi.string().required(),
  password: Joi.string().required(),
  proxyId: Joi.string().optional()
});

/**
 * Validation schema for searching LinkedIn profiles
 */
export const searchProfilesSchema = Joi.object({
  linkedinAccountId: Joi.string().required(),
  password: Joi.string().required(),
  proxyId: Joi.string().optional(),
  keywords: Joi.string().required(),
  filters: Joi.object({
    location: Joi.string().optional(),
    company: Joi.string().optional(),
    industry: Joi.string().optional(),
    connections: Joi.string().optional()
  }).optional(),
  maxResults: Joi.number().integer().min(1).max(1000).default(10),
  campaignId: Joi.string().optional()
});

/**
 * Validation schema for getting next available LinkedIn account
 */
export const getNextAccountSchema = Joi.object({
  excludedIds: Joi.string().optional(),
  lastUsedBefore: Joi.string().optional()
});

/**
 * Validation schema for getting next available proxy
 */
export const getNextProxySchema = Joi.object({
  excludedIds: Joi.string().optional(),
  lastUsedBefore: Joi.string().optional()
});

// New schemas for selector verification API endpoints

export const verifySelectorSchema = Joi.object({
  linkedinAccountId: Joi.string().required(),
  password: Joi.string().optional(),
  proxyId: Joi.string().optional(),
  profileUrl: Joi.string().uri().optional(),
  useLatestLead: Joi.boolean().default(false),
  outputPath: Joi.string().optional()
}).custom((value, helpers) => {
  // Require either profileUrl or useLatestLead
  if (!value.profileUrl && !value.useLatestLead) {
    return helpers.error('object.custom', { message: 'Either profileUrl or useLatestLead must be provided' });
  }
  return value;
});

export const updateSelectorSchema = Joi.object({
  metricsPath: Joi.string().required(),
  threshold: Joi.number().min(0).max(1).default(0.5),
  category: Joi.alternatives().try(
    Joi.string(),
    Joi.array().items(Joi.string())
  ).optional(),
  updateSelectorFile: Joi.boolean().default(true),
  selectorFile: Joi.string().optional()
});
