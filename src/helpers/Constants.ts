/**
 * Role definitions for user authentication
 */
export const rolesObj = {
  ADMIN: "ADMIN",
  USER: "USER",
  CLIENT: "CLIENT",
} as const;

export type Role = (typeof rolesObj)[keyof typeof rolesObj];

/**
 * Status constants for campaigns
 */
export const campaignStatusObj = {
  CREATED: "CREATED",
  PROCESSING: "PROCESSING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
} as const;

export type CampaignStatus =
  (typeof campaignStatusObj)[keyof typeof campaignStatusObj];

/**
 * Status constants for leads
 */
export const leadStatusObj = {
  CREATED: "CREATED",
  CONTACTED: "CONTACTED",
  RESPONDED: "RESPONDED",
  QUALIFIED: "QUALIFIED",
  CONVERTED: "CONVERTED",
  REJECTED: "REJECTED",
} as const;

export type LeadStatus = (typeof leadStatusObj)[keyof typeof leadStatusObj];

/**
 * Rating constants for leads and users
 */
export const ratingObj = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
} as const;

export type Rating = (typeof ratingObj)[keyof typeof ratingObj];

/**
 * API Success Messages
 */
export const SuccessMessages = {
  // User
  USER_CREATED: "User created successfully",
  USER_UPDATED: "User updated successfully",
  USER_DELETED: "User deleted successfully",
  LOGIN_SUCCESS: "Login successful",
  LOGOUT_SUCCESS: "Logout successful",
  PASSWORD_RESET: "Password reset email sent",
  PASSWORD_UPDATED: "Password updated successfully",
  // Campaign
  CAMPAIGN_CREATED: "Campaign created successfully",
  CAMPAIGN_UPDATED: "Campaign updated successfully",
  CAMPAIGN_DELETED: "Campaign deleted successfully",
  CAMPAIGN_STARTED: "Campaign started successfully",
  CAMPAIGN_STOPPED: "Campaign stopped successfully",
  // Lead
  LEAD_CREATED: "Lead created successfully",
  LEAD_UPDATED: "Lead updated successfully",
  LEAD_DELETED: "Lead deleted successfully",
  // Comment
  COMMENT_ADDED: "Comment added successfully",
  COMMENT_UPDATED: "Comment updated successfully",
  COMMENT_DELETED: "Comment deleted successfully",
  // Status
  LEAD_STATUS_CREATED: "Lead status created successfully",
  LEAD_STATUS_UPDATED: "Lead status updated successfully",
  LEAD_STATUS_DELETED: "Lead status deleted successfully",
  // LinkedIn Account
  LINKEDIN_ACCOUNT_CREATED: "LinkedIn account created successfully",
  LINKEDIN_ACCOUNT_UPDATED: "LinkedIn account updated successfully",
  LINKEDIN_ACCOUNT_DELETED: "LinkedIn account deleted successfully",
  // Proxy
  PROXY_CREATED: "Proxy created successfully",
  PROXY_UPDATED: "Proxy updated successfully",
  PROXY_DELETED: "Proxy deleted successfully",
  // Email Settings
  EMAIL_SETTINGS_CREATED: "Email settings created successfully",
  EMAIL_SETTINGS_UPDATED: "Email settings updated successfully",
} as const;

/**
 * API Error Messages
 */
export const ErrorMessages = {
  // General
  INVALID_ID: "Invalid object ID format",
  NOT_FOUND: "Resource not found",
  SERVER_ERROR: "Internal server error",
  UNAUTHORIZED: "Unauthorized access",
  FORBIDDEN: "Access forbidden",
  BAD_REQUEST: "Bad request",
  REQUIRED_FIELDS: "Required fields missing",
  // Auth/User
  INVALID_EMAIL: "Invalid email format",
  INVALID_PASSWORD: "Invalid password",
  EMAIL_EXISTS: "Email already exists",
  PHONE_EXISTS: "Phone number already exists",
  USER_NOT_FOUND: "User not found",
  INACTIVE_USER: "User account is inactive",
  // Campaign
  CAMPAIGN_NOT_FOUND: "Campaign not found",
  CAMPAIGN_PROCESSING: "Campaign is currently processing",
  // Lead
  LEAD_NOT_FOUND: "Lead not found",
  LEAD_EXISTS: "Lead with this Client ID already exists",
  // LinkedIn Account
  LINKEDIN_ACCOUNT_NOT_FOUND: "LinkedIn account not found",
  LINKEDIN_ACCOUNT_EXISTS:
    "LinkedIn account with this name/email already exists",
  LINKEDIN_DECRYPT_FAILED: "Failed to decrypt LinkedIn password",
  // Proxy
  PROXY_NOT_FOUND: "Proxy not found",
  PROXY_EXISTS: "Proxy with this value already exists",
  // Comment
  COMMENT_NOT_FOUND: "Comment not found",
  // Email Settings
  EMAIL_SETTINGS_NOT_FOUND: "Email settings not found",
} as const;
