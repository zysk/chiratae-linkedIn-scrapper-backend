#!/usr/bin/env node

/**
 * This script replaces console.log/error/warn statements with appropriate logger calls
 * Works on TypeScript files in the src directory
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

console.log(chalk.blue('Starting console.log replacement script...'));

// Helper function to process files recursively
function processDirectory(directory) {
  const files = fs.readdirSync(directory);

  files.forEach(file => {
    const filePath = path.join(directory, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && !filePath.includes('node_modules') && !filePath.includes('dist')) {
      processDirectory(filePath);
    } else if (stat.isFile() && filePath.endsWith('.ts') && !filePath.includes('.d.ts')) {
      processFile(filePath);
    }
  });
}

// Process a single file
function processFile(filePath) {
  try {
    console.log(chalk.cyan(`Processing ${filePath}...`));

    const contextName = getContextName(filePath);
    let content = fs.readFileSync(filePath, 'utf-8');
    const originalContent = content;
    let loggerImportAdded = false;

    // Check if the file has already imported the Logger
    const hasLoggerImport = /import.*Logger.*from/i.test(content);
    const hasLoggerInstance = /const\s+logger\s*=\s*new\s+Logger/i.test(content);

    // Replace console.log statements with logger.info
    content = content.replace(
      /console\.log\((.*?)\);?/g,
      (match, args) => {
        // Skip replacement in specific files
        if (isExcludedFile(filePath)) {
          return match;
        }

        // Add logger import and initialization if needed
        if (!hasLoggerImport && !loggerImportAdded) {
          content = addLoggerImport(content);
          loggerImportAdded = true;
        }

        // If we have a logger instance already, use it
        if (hasLoggerInstance) {
          return `logger.info(${args});`;
        } else {
          // Otherwise, create a local logger variable
          if (!content.includes(`const logger = new Logger('${contextName}')`)) {
            const loggerVarPattern = /const\s+.*?\s*=.*?;\n/;
            const matches = content.match(loggerVarPattern);
            if (matches && matches.length > 0) {
              const lastMatch = matches[matches.length - 1];
              const index = content.indexOf(lastMatch) + lastMatch.length;
              content = content.slice(0, index) +
                      `const logger = new Logger('${contextName}');\n` +
                      content.slice(index);
            }
          }
          return `logger.info(${args});`;
        }
      }
    );

    // Replace console.error statements with logger.error
    content = content.replace(
      /console\.error\((.*?)\);?/g,
      (match, args) => {
        if (isExcludedFile(filePath)) {
          return match;
        }

        // Add logger import and initialization if needed and not already added
        if (!hasLoggerImport && !loggerImportAdded) {
          content = addLoggerImport(content);
          loggerImportAdded = true;
        }

        if (hasLoggerInstance) {
          return `logger.error(${args});`;
        } else {
          if (!content.includes(`const logger = new Logger('${contextName}')`)) {
            const loggerVarPattern = /const\s+.*?\s*=.*?;\n/;
            const matches = content.match(loggerVarPattern);
            if (matches && matches.length > 0) {
              const lastMatch = matches[matches.length - 1];
              const index = content.indexOf(lastMatch) + lastMatch.length;
              content = content.slice(0, index) +
                      `const logger = new Logger('${contextName}');\n` +
                      content.slice(index);
            }
          }
          return `logger.error(${args});`;
        }
      }
    );

    // Replace console.warn statements with logger.warn
    content = content.replace(
      /console\.warn\((.*?)\);?/g,
      (match, args) => {
        if (isExcludedFile(filePath)) {
          return match;
        }

        // Add logger import and initialization if needed and not already added
        if (!hasLoggerImport && !loggerImportAdded) {
          content = addLoggerImport(content);
          loggerImportAdded = true;
        }

        if (hasLoggerInstance) {
          return `logger.warn(${args});`;
        } else {
          if (!content.includes(`const logger = new Logger('${contextName}')`)) {
            const loggerVarPattern = /const\s+.*?\s*=.*?;\n/;
            const matches = content.match(loggerVarPattern);
            if (matches && matches.length > 0) {
              const lastMatch = matches[matches.length - 1];
              const index = content.indexOf(lastMatch) + lastMatch.length;
              content = content.slice(0, index) +
                      `const logger = new Logger('${contextName}');\n` +
                      content.slice(index);
            }
          }
          return `logger.warn(${args});`;
        }
      }
    );

    // Only write the file if changes were made
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(chalk.green(`Updated ${filePath}`));
    }
  } catch (error) {
    console.error(chalk.red(`Error processing ${filePath}:`), error);
  }
}

// Get a meaningful context name from the file path
function getContextName(filePath) {
  const parts = filePath.split(path.sep);
  const fileName = parts[parts.length - 1];
  const baseName = fileName.replace(/\.(ts|js)$/, '');
  return baseName.charAt(0).toUpperCase() + baseName.slice(1);
}

// Check if a file should be excluded from processing
function isExcludedFile(filePath) {
  return filePath.includes('test') ||
         filePath.includes('__tests__') ||
         filePath.includes('scripts/') ||
         filePath.includes('jest.config');
}

// Add Logger import to file content
function addLoggerImport(content) {
  // Check if there are other imports
  const importPattern = /import.*from.*;/;
  const importMatch = content.match(importPattern);

  if (importMatch) {
    // Add after last import
    const lastImport = content.lastIndexOf('import');
    const endOfImports = content.indexOf(';', lastImport) + 1;
    return content.slice(0, endOfImports) +
          '\nimport { Logger } from \'../services/logger.service\';\n' +
          content.slice(endOfImports);
  } else {
    // Add to the beginning of the file
    return 'import { Logger } from \'../services/logger.service\';\n\n' + content;
  }
}

try {
  // Process the src directory
  processDirectory(path.join(__dirname, '..', 'src'));

  // Run ESLint fix for other issues
  console.log(chalk.blue('Running ESLint to fix other issues...'));
  execSync('npm run lint:fix', { stdio: 'inherit' });

  console.log(chalk.green('Console statement replacements completed!'));
} catch (error) {
  console.error(chalk.red('Error running replacements:'), error);
  process.exit(1);
}