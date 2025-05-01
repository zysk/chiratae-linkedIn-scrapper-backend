/**
 * Role definitions for user authentication
 */
export const rolesObj = {
  ADMIN: 'ADMIN',
  USER: 'USER',
  CLIENT: 'CLIENT'
} as const;

export type Role = typeof rolesObj[keyof typeof rolesObj];

/**
 * Status constants for campaigns
 */
export const campaignStatusObj = {
  CREATED: 'CREATED',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED'
} as const;

export type CampaignStatus = typeof campaignStatusObj[keyof typeof campaignStatusObj];

/**
 * Status constants for leads
 */
export const leadStatusObj = {
  CREATED: 'CREATED',
  CONTACTED: 'CONTACTED',
  RESPONDED: 'RESPONDED',
  QUALIFIED: 'QUALIFIED',
  CONVERTED: 'CONVERTED',
  REJECTED: 'REJECTED'
} as const;

export type LeadStatus = typeof leadStatusObj[keyof typeof leadStatusObj];

/**
 * Rating constants for leads and users
 */
export const ratingObj = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH'
} as const;

export type Rating = typeof ratingObj[keyof typeof ratingObj];

/**
 * Error messages for validation and responses
 */
export const ErrorMessages = {
  INVALID_EMAIL: 'Invalid email format',
  INVALID_PASSWORD: 'Invalid password',
  EMAIL_EXISTS: 'Email already exists',
  PHONE_EXISTS: 'Phone number already exists',
  USER_NOT_FOUND: 'User not found',
  INACTIVE_USER: 'Your account is inactive. Please contact admin',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Forbidden access',
  SERVER_ERROR: 'Internal server error',
  INVALID_TOKEN: 'Invalid token',
  TOKEN_EXPIRED: 'Token expired',
  MISSING_TOKEN: 'Authorization token missing',
  CAMPAIGN_NOT_FOUND: 'Campaign not found',
  LINKEDIN_ACCOUNT_NOT_FOUND: 'LinkedIn account not found',
  PROXY_NOT_FOUND: 'Proxy not found',
  LEAD_NOT_FOUND: 'Lead not found',
  LEAD_STATUS_NOT_FOUND: 'Lead status not found',
  INVALID_ID: 'Invalid ID format',
  REQUIRED_FIELDS: 'Required fields missing'
} as const;

/**
 * Success messages for responses
 */
export const SuccessMessages = {
  USER_CREATED: 'User created successfully',
  USER_UPDATED: 'User updated successfully',
  USER_DELETED: 'User deleted successfully',
  LOGIN_SUCCESS: 'Login successful',
  CAMPAIGN_CREATED: 'Campaign created successfully',
  CAMPAIGN_UPDATED: 'Campaign updated successfully',
  CAMPAIGN_DELETED: 'Campaign deleted successfully',
  LINKEDIN_ACCOUNT_CREATED: 'LinkedIn account created successfully',
  LINKEDIN_ACCOUNT_UPDATED: 'LinkedIn account updated successfully',
  LINKEDIN_ACCOUNT_DELETED: 'LinkedIn account deleted successfully',
  PROXY_CREATED: 'Proxy created successfully',
  PROXY_UPDATED: 'Proxy updated successfully',
  PROXY_DELETED: 'Proxy deleted successfully',
  LEAD_CREATED: 'Lead created successfully',
  LEAD_UPDATED: 'Lead updated successfully',
  LEAD_DELETED: 'Lead deleted successfully'
} as const;