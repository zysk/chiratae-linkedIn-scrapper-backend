#!/usr/bin/env node

import { program } from 'commander';
import { LinkedInProfileScraper } from '../services/linkedin/LinkedInProfileScraper';
import { SelectorHealthMetrics } from '../services/linkedin/SelectorVerifier';
import LinkedInAuthService from '../services/linkedin/LinkedInAuthService';
import LinkedInAccount from '../models/linkedinAccount.model';
import logger from '../utils/logger';
import fs from 'fs/promises';
import path from 'path';

/**
 * Tool for testing LinkedIn selectors against real profiles
 * Helps to identify which selectors are working well and which need attention
 */
async function main() {
  program
    .name('verify-selectors')
    .description('Test LinkedIn selectors against real profiles to verify their effectiveness')
    .option('-u, --url <url>', 'LinkedIn profile URL to test (required)')
    .option('-o, --output <path>', 'Path to save selector health metrics (default: "./selector-health.json")')
    .option('-c, --count <number>', 'Number of profiles to test', '1')
    .option('-v, --verbose', 'Enable verbose logging')
    .option('-e, --email <email>', 'LinkedIn account email')
    .option('-p, --password <password>', 'LinkedIn account password')
    .option('-i, --account-id <id>', 'LinkedIn account ID from database (alternative to email/password)')
    .parse(process.argv);

  const options = program.opts();

  if (!options.url) {
    logger.error('LinkedIn profile URL is required. Use --url or -u option.');
    process.exit(1);
  }

  // Set log level based on verbose flag
  if (options.verbose) {
    process.env.LOG_LEVEL = 'debug';
  }

  // Enable selector debugging
  process.env.DEBUG_SELECTORS = 'true';

  try {
    const scraper = LinkedInProfileScraper;
    logger.info(`Testing selectors against profile: ${options.url}`);

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
      logger.warn('No LinkedIn authentication provided. Results may be limited to public profile data.');
      logger.info('Consider providing credentials with --email and --password or --account-id options.');
    }

    // Run verification
    const healthMetrics = await LinkedInProfileScraper.verifySelectors(options.url, linkedInAccount);

    // Save metrics to file
    const outputPath = options.output || './selector-health.json';

    // Convert Map to object for serialization
    const metricsObj: Record<string, SelectorHealthMetrics> = {};
    healthMetrics.forEach((value: SelectorHealthMetrics, key: string) => {
      metricsObj[key] = value;
    });

    await fs.writeFile(
      path.resolve(outputPath),
      JSON.stringify(metricsObj, null, 2),
      'utf8'
    );

    logger.info(`Selector health metrics saved to ${outputPath}`);

    // Print summary statistics
    const categories = new Set<string>();
    let totalSelectors = 0;
    let workingSelectors = 0;

    for (const metrics of healthMetrics.values()) {
      categories.add(metrics.category);
      totalSelectors++;

      if (metrics.successRate > 0) {
        workingSelectors++;
      }
    }

    logger.info('=== SUMMARY ===');
    logger.info(`Tested ${totalSelectors} selectors across ${categories.size} categories`);
    logger.info(`Working selectors: ${workingSelectors} (${Math.round(workingSelectors / totalSelectors * 100)}%)`);
    logger.info('See the output file for detailed metrics');

  } catch (error) {
    logger.error('Error verifying selectors:', error);
    process.exit(1);
  }
}

main().catch(error => {
  logger.error('Unhandled error:', error);
  process.exit(1);
});
