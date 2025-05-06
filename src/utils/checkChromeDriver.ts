import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import logger from './logger';
import os from 'os';

/**
 * Checks if ChromeDriver is installed and compatible with current Chrome version
 */
export async function checkChromeDriver(): Promise<boolean> {
  try {
    logger.info('Checking ChromeDriver installation...');

    const platform = os.platform();
    let chromeDriverPath: string;

    // Get correct ChromeDriver path based on platform
    if (platform === 'win32') {
      // Check for win64 directory first, then fall back to win32
      const win64Path = path.join(process.cwd(), 'chromedriver', 'chromedriver-win64', 'chromedriver.exe');
      const win32Path = path.join(process.cwd(), 'chromedriver', 'chromedriver-win32', 'chromedriver.exe');

      if (fs.existsSync(win64Path)) {
        chromeDriverPath = win64Path;
      } else if (fs.existsSync(win32Path)) {
        chromeDriverPath = win32Path;
      } else {
        logger.warn('ChromeDriver not found. Running auto-update script...');
        await runAutoUpdate();
        return true;
      }
    } else if (platform === 'darwin') {
      chromeDriverPath = path.join(process.cwd(), 'chromedriver', 'chromedriver-mac', 'chromedriver');
      if (!fs.existsSync(chromeDriverPath)) {
        logger.warn('ChromeDriver not found. Running auto-update script...');
        await runAutoUpdate();
        return true;
      }
    } else {
      // Linux
      chromeDriverPath = path.join(process.cwd(), 'chromedriver', 'chromedriver-linux64', 'chromedriver');
      if (!fs.existsSync(chromeDriverPath)) {
        logger.warn('ChromeDriver not found. Running auto-update script...');
        await runAutoUpdate();
        return true;
      }
    }

    // Check ChromeDriver version
    try {
      const versionOutput = execSync(`"${chromeDriverPath}" --version`).toString();
      logger.info(`Found ChromeDriver: ${versionOutput.trim()}`);
      return true;
    } catch (err) {
      logger.warn(`Error checking ChromeDriver version: ${err}`);
      logger.warn('Running auto-update script to fix ChromeDriver...');
      await runAutoUpdate();
      return true;
    }

  } catch (error) {
    logger.error('Error checking ChromeDriver:', error);
    return false;
  }
}

/**
 * Run the ChromeDriver auto-update script
 */
async function runAutoUpdate(): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      logger.info('Running ChromeDriver auto-update script...');

      // Run the script using npm script
      execSync('npm run setup-chromedriver', {
        stdio: 'inherit',
        cwd: process.cwd()
      });

      logger.info('ChromeDriver update completed successfully');
      resolve();
    } catch (error) {
      logger.error('Failed to update ChromeDriver:', error);
      reject(error);
    }
  });
}

export default { checkChromeDriver };
