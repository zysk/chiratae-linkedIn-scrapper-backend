import { ErrorHandler } from '../utils/ErrorHandler';

export const seleniumErrorHandler = (error) => {
    // Log the error for debugging
    console.error('Selenium Error:', error);

    // Throw a formatted error
    throw new ErrorHandler({
        message: 'LinkedIn automation error occurred',
        status: 500,
        details: error?.message || 'Unknown selenium error'
    });
};
