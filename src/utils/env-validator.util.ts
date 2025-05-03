import { config } from '../config/config';
import { Logger } from '../services/logger.service';

const logger = new Logger('EnvValidator');

/**
 * Required environment variables
 */
export const REQUIRED_ENV_VARS = [
  'PORT',
  'NODE_ENV',
  'MONGOURI',
  'ACCESS_TOKEN_SECRET',
  'ACCESS_TOKEN_LIFE',
  'ENCRYPTION_KEY',
];

/**
 * Environment variables that should have non-default values in production
 */
export const PRODUCTION_CRITICAL_VARS = [
  'ACCESS_TOKEN_SECRET',
  'ENCRYPTION_KEY',
];

/**
 * Type guard to check if a key exists in config object
 * @param key The key to check
 */
const isConfigKey = (key: string): key is keyof typeof config => {
  return key in config;
};

/**
 * Validates that all required environment variables are defined
 * @returns Object containing missing variables and whether validation passed
 */
export const validateRequiredEnvVars = (): {
  valid: boolean;
  missing: string[];
} => {
  const missing = REQUIRED_ENV_VARS.filter(key => {
    // Check if the key exists in config
    if (!isConfigKey(key)) {
      return true; // Missing if key doesn't exist
    }

    // Check if the value is defined and not empty
    const value = config[key];
    return !value || (typeof value === 'string' && value.trim() === '');
  });

  return {
    valid: missing.length === 0,
    missing,
  };
};

/**
 * Validates that production critical variables are not using default values
 * @param defaultConfig The default config values
 * @returns Object containing variables with default values and whether validation passed
 */
export const validateProductionEnvVars = (
  defaultConfig: Record<string, string>
): {
  valid: boolean;
  usingDefaults: string[];
} => {
  // Only check in production environment
  if (config.NODE_ENV !== 'production') {
    return { valid: true, usingDefaults: [] };
  }

  const usingDefaults = PRODUCTION_CRITICAL_VARS.filter(key => {
    // Check if the key exists in both configs
    if (!isConfigKey(key) || !(key in defaultConfig)) {
      return false;
    }

    const configValue = config[key];
    const defaultValue = defaultConfig[key];
    return configValue === defaultValue;
  });

  return {
    valid: usingDefaults.length === 0,
    usingDefaults,
  };
};

/**
 * Performs all environment validation checks
 * @param defaultConfig The default config values
 * @param exitOnFailure Whether to exit the process on validation failure
 * @returns Whether all validations passed
 */
export const validateEnvironment = (
  defaultConfig: Record<string, string>,
  exitOnFailure = false
): boolean => {
  const { valid: requiredValid, missing } = validateRequiredEnvVars();

  if (!requiredValid) {
    logger.error(`Missing required environment variables: ${missing.join(', ')}`);
    if (exitOnFailure) {
      process.exit(1);
    }
    return false;
  }

  const { valid: productionValid, usingDefaults } = validateProductionEnvVars(defaultConfig);

  if (!productionValid) {
    logger.error(
      `Using default values for critical variables in production: ${usingDefaults.join(', ')}`
    );
    logger.error('This is a security risk. Please set proper values for these variables.');
    if (exitOnFailure) {
      process.exit(1);
    }
    return false;
  }

  return true;
};

export default {
  validateRequiredEnvVars,
  validateProductionEnvVars,
  validateEnvironment,
  REQUIRED_ENV_VARS,
  PRODUCTION_CRITICAL_VARS,
};