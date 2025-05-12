#!/usr/bin/env node

import { program } from 'commander';
import fs from 'fs/promises';
import path from 'path';
import prompt from 'prompts';
import LinkedInAccount from '../models/linkedinAccount.model';
import { SelectorHealthMetrics } from '../services/linkedin/SelectorVerifier';
import logger from '../utils/logger';

/**
 * Tool for analyzing selector health metrics and helping
 * developers update selectors that have low success rates
 */
async function main() {
  program
    .name('update-selectors')
    .description('Analyze selector health metrics and update selectors as needed')
    .option('-i, --input <path>', 'Path to selector health metrics JSON file (output from verify-selectors)')
    .option('-t, --threshold <number>', 'Success rate threshold for flagging selectors (0-1)', '0.5')
    .option('-c, --category <name>', 'Focus on a specific category of selectors')
    .option('-v, --verbose', 'Enable verbose logging')
    .option('-e, --email <email>', 'LinkedIn account email')
    .option('-p, --password <password>', 'LinkedIn account password')
    .option('-a, --account-id <id>', 'LinkedIn account ID from database (alternative to email/password)')
    .parse(process.argv);

  const options = program.opts();

  if (!options.input) {
    logger.error('Selector health metrics file is required. Use --input or -i option.');
    process.exit(1);
  }

  // Set log level based on verbose flag
  if (options.verbose) {
    process.env.LOG_LEVEL = 'debug';
  }

  try {
    const inputPath = path.resolve(options.input);
    logger.info(`Reading metrics from: ${inputPath}`);

    // Read metrics from file
    const metricsRaw = await fs.readFile(inputPath, 'utf8');
    const metricsObj = JSON.parse(metricsRaw);

    // Handle LinkedIn authentication if credentials are provided
    let linkedInAccount = null;

    if (options.accountId) {
      // Fetch account from database
      try {
        logger.info(`Using LinkedIn account ID: ${options.accountId}`);
        linkedInAccount = await LinkedInAccount.findById(options.accountId);

        if (!linkedInAccount) {
          logger.error(`LinkedIn account with ID ${options.accountId} not found.`);
          process.exit(1);
        }
      } catch (error) {
        logger.error(`Error fetching LinkedIn account: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
      }
    } else if (options.email && options.password) {
      // Create temporary account object
      logger.info(`Using provided LinkedIn credentials for: ${options.email}`);
      linkedInAccount = {
        username: options.email,
        getPassword: () => options.password
      } as any;
    }

    // Inform user if no authentication is being used
    if (!linkedInAccount) {
      logger.warn('No LinkedIn authentication provided. You may need to be logged in to update selectors effectively.');
      logger.info('Consider providing credentials with --email and --password or --account-id options.');
    }

    // Convert back to Map for easier processing
    const healthMetrics = new Map<string, SelectorHealthMetrics>();
    for (const [key, value] of Object.entries(metricsObj)) {
      healthMetrics.set(key, value as SelectorHealthMetrics);
    }

    // Group by category
    const categorizedMetrics = new Map<string, SelectorHealthMetrics[]>();
    for (const metrics of healthMetrics.values()) {
      if (!categorizedMetrics.has(metrics.category)) {
        categorizedMetrics.set(metrics.category, []);
      }
      categorizedMetrics.get(metrics.category)?.push(metrics);
    }

    // Filter by specified category if provided
    const categoriesToProcess = options.category
      ? (categorizedMetrics.has(options.category) ? [options.category] : [])
      : Array.from(categorizedMetrics.keys());

    if (options.category && categoriesToProcess.length === 0) {
      logger.error(`Category '${options.category}' not found in metrics file.`);
      process.exit(1);
    }

    const threshold = parseFloat(options.threshold);

    // Process each category
    for (const category of categoriesToProcess) {
      const metrics = categorizedMetrics.get(category)!;

      logger.info(`\n📋 CATEGORY: ${category}`);

      // Sort by success rate (descending)
      metrics.sort((a, b) => b.successRate - a.successRate);

      // Find poor performing selectors
      const poorSelectors = metrics.filter(m => m.successRate < threshold);
      const goodSelectors = metrics.filter(m => m.successRate >= threshold);

      logger.info(`Found ${goodSelectors.length} good selectors and ${poorSelectors.length} poor selectors.`);

      if (poorSelectors.length === 0) {
        logger.info('All selectors in this category are performing well!');
        continue;
      }

      // Show example of good selector (if available)
      if (goodSelectors.length > 0) {
        const best = goodSelectors[0];
        logger.info(`\n✅ Best performing selector: ${best.selector}`);
        logger.info(`   Success rate: ${(best.successRate * 100).toFixed(1)}%`);
        if (best.lastText) {
          logger.info(`   Example text: "${best.lastText}"`);
        }
      }

      // Process each poor selector
      for (const poor of poorSelectors) {
        logger.info(`\n❌ Poor selector: ${poor.selector}`);
        logger.info(`   Success rate: ${(poor.successRate * 100).toFixed(1)}%`);

        const response = await prompt({
          type: 'select',
          name: 'action',
          message: `What would you like to do with this selector?`,
          choices: [
            { title: 'Replace it', value: 'replace' },
            { title: 'Remove it', value: 'remove' },
            { title: 'Skip (keep as is)', value: 'skip' }
          ]
        });

        if (response.action === 'replace') {
          const newSelectorResp = await prompt({
            type: 'text',
            name: 'newSelector',
            message: 'Enter the new selector:',
            initial: poor.selector
          });

          logger.info(`Will replace: ${poor.selector}\nWith: ${newSelectorResp.newSelector}`);

          // Here you would update the selector in your codebase
          // This would require parsing and modifying the source files
          // For now, we'll just provide guidance on what needs to be updated
        }
        else if (response.action === 'remove') {
          logger.info(`Will remove selector: ${poor.selector}`);
          // Similar to above, this would require source code modification
        }
      }
    }

    logger.info('\n🔍 RECOMMENDED ACTIONS:');
    logger.info('1. Update the selector arrays in src/services/linkedin/SelectorVerifier.ts');
    logger.info('2. Verify your changes with npm run verify-selectors');
    logger.info('3. Handle multiple selector variations to improve reliability');

    // Add reminder about authentication
    if (linkedInAccount) {
      logger.info('4. Remember to use the same authentication when verifying your changes');
    } else {
      logger.info('4. Consider using LinkedIn authentication for better results');
    }

  } catch (error) {
    logger.error('Error processing selector metrics:', error);
    process.exit(1);
  }
}

main().catch(error => {
  logger.error('Unhandled error:', error);
  process.exit(1);
});
