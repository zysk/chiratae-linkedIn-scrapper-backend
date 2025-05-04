/**
 * Constants used throughout the application
 */

// User roles
export const rolesObj = {
  ADMIN: 'ADMIN',
  USER: 'USER',
  CLIENT: 'CLIENT'
};

// General model statuses
export const generalModelStatuses = {
  CREATED: 'CREATED',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED'
};

// Lead statuses
export const leadStatuses = {
  NEW: 'NEW',
  CONTACTED: 'CONTACTED',
  QUALIFIED: 'QUALIFIED',
  CONVERTED: 'CONVERTED',
  DISQUALIFIED: 'DISQUALIFIED'
};

// HTTP Status codes
export const statusCodes = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500
};
