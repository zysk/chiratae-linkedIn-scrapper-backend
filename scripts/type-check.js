#!/usr/bin/env node
// This script runs TypeScript type checking to catch type errors early

// Node.js script to run TypeScript type checking
const { execSync } = require('child_process');
const chalk = require('chalk');

console.log(chalk.blue('Running TypeScript type checking...'));

try {
  // Run TypeScript compiler in noEmit mode (just type checking, no compilation)
  execSync('npx tsc --noEmit', { stdio: 'inherit' });
  console.log(chalk.green('✓ Type checking passed!'));
} catch (error) {
  console.error(chalk.red('✗ Type checking failed!'));
  process.exit(1);
}