#!/usr/bin/env node

/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-env node */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

console.log(chalk.blue('Starting lint fix script...'));

// Helper function to process files recursively
function processDirectory(directory) {
  const files = fs.readdirSync(directory);

  files.forEach(file => {
    const filePath = path.join(directory, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && !filePath.includes('node_modules') && !filePath.includes('dist')) {
      processDirectory(filePath);
    } else if (stat.isFile() && (filePath.endsWith('.ts') || filePath.endsWith('.js'))) {
      processFile(filePath);
    }
  });
}

// Process a single file
function processFile(filePath) {
  try {
    console.log(chalk.cyan(`Processing ${filePath}...`));

    let content = fs.readFileSync(filePath, 'utf-8');
    const originalContent = content;

    // Replace console.log statements with logger
    content = content.replace(
      /console\.log\((.*)\);?/g,
      (match, args) => {
        // Don't replace in these specific files
        if (filePath.includes('scripts/') || filePath.includes('jest.config')) {
          return match;
        }

        // Try to determine the context from the file path
        const parts = filePath.split('/');
        const filename = parts[parts.length - 1];
        // Renamed to avoid unused variable warning
        const context = filename.replace(/\.(ts|js)$/, '');

        return `// Replace with logger: logger.info(${args});`;
      }
    );

    // Replace console.error statements with logger
    content = content.replace(
      /console\.error\((.*)\);?/g,
      (match, args) => {
        // Don't replace in these specific files
        if (filePath.includes('scripts/') || filePath.includes('jest.config')) {
          return match;
        }

        // Try to determine the context from the file path
        const parts = filePath.split('/');
        const filename = parts[parts.length - 1];
        // Renamed to avoid unused variable warning
        const context = filename.replace(/\.(ts|js)$/, '');

        return `// Replace with logger: logger.error(${args});`;
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

try {
  // Process the src directory
  /* eslint-disable no-undef */
  processDirectory(path.join(__dirname, '..', 'src'));
  /* eslint-enable no-undef */

  // Run ESLint fix for other issues
  console.log(chalk.blue('Running ESLint to fix other issues...'));
  execSync('npm run lint:fix', { stdio: 'inherit' });

  console.log(chalk.green('Linting fixes completed!'));
  console.log(chalk.yellow('Note: Console statements have been commented out and need to be manually replaced with logger calls.'));
} catch (error) {
  console.error(chalk.red('Error running linting fixes:'), error);
  /* eslint-disable no-undef */
  process.exit(1);
  /* eslint-enable no-undef */
}