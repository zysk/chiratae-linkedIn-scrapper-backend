import fs from 'fs/promises';
import path from 'path';
import logger from './logger';

/**
 * LinkedIn selectors organized by category
 */
export interface LinkedInSelectors {
  [category: string]: string[];
}

// Default selectors to use as fallback
export const defaultSelectors: LinkedInSelectors = {
  'Profile Name': [
    'h1.text-heading-xlarge.inline.t-24.v-align-middle.break-words',
    'h1.text-heading-xlarge',
    'h1.pv-text-details__title--main',
    'div.pv-text-details__left-panel h1'
  ],
  'Profile Headline': [
    'div.pv-text-details__left-panel div.text-body-medium',
    'div.ph5 div.text-body-medium',
    'div.pv-text-details__title div.text-body-medium'
  ],
  'Profile Location': [
    'div.pv-text-details__left-panel span.text-body-small.inline.t-black--light.break-words',
    'div.ph5 span.text-body-small.inline.t-black--light.break-words',
    'div.pv-text-details__title span.text-body-small.inline.t-black--light.break-words'
  ],
  'About Section': [
    'section#about',
    'section[data-section="about"]',
    'div.pvs-list__outer-container'
  ],
  'Experience Section': [
    'section#experience',
    'section[data-section="experience"]',
    'div.pvs-list__outer-container'
  ],
  'Education Section': [
    'section#education',
    'section[data-section="education"]',
    'div.pvs-list__outer-container'
  ],
  'Skills': [
    'div.pvs-entity',
    'div.pv-skill-category-entity',
    'li.artdeco-list__item'
  ]
};

/**
 * Current selector instance - will be loaded from file if available
 */
let currentSelectors: LinkedInSelectors = { ...defaultSelectors };

/**
 * Path to the selectors file
 */
let selectorsFilePath: string | null = null;

/**
 * Set the path to the selectors file
 * @param filePath Path to the selectors JSON file
 */
export function setSelectorsFilePath(filePath: string): void {
  selectorsFilePath = filePath;
}

/**
 * Load selectors from a JSON file
 * @param filePath Path to the selectors JSON file
 * @returns Promise resolving to the loaded selectors
 */
export async function loadSelectors(filePath?: string): Promise<LinkedInSelectors> {
  try {
    const targetPath = filePath || selectorsFilePath;

    if (!targetPath) {
      logger.warn('No selectors file path provided, using default selectors');
      return { ...defaultSelectors };
    }

    const resolvedPath = path.resolve(targetPath);
    logger.info(`Loading selectors from: ${resolvedPath}`);

    const fileContent = await fs.readFile(resolvedPath, 'utf8');
    const loadedSelectors = JSON.parse(fileContent) as LinkedInSelectors;

    // Merge with defaults to ensure all categories exist
    const mergedSelectors: LinkedInSelectors = { ...defaultSelectors };

    for (const [category, selectors] of Object.entries(loadedSelectors)) {
      mergedSelectors[category] = selectors;
    }

    // Update current selectors
    currentSelectors = mergedSelectors;

    logger.info(`Successfully loaded selectors from ${resolvedPath}`);
    return mergedSelectors;
  } catch (error) {
    logger.error(`Error loading selectors: ${error instanceof Error ? error.message : String(error)}`);
    logger.info('Using default selectors as fallback');
    return { ...defaultSelectors };
  }
}

/**
 * Save selectors to a JSON file
 * @param selectors The selectors to save
 * @param filePath Path to the selectors JSON file (optional if setSelectorsFilePath was called)
 * @returns Promise that resolves when the operation is complete
 */
export async function saveSelectors(selectors: LinkedInSelectors, filePath?: string): Promise<void> {
  try {
    const targetPath = filePath || selectorsFilePath;

    if (!targetPath) {
      throw new Error('No selectors file path provided');
    }

    const resolvedPath = path.resolve(targetPath);
    logger.info(`Saving selectors to: ${resolvedPath}`);

    await fs.writeFile(resolvedPath, JSON.stringify(selectors, null, 2), 'utf8');

    // Update current selectors
    currentSelectors = { ...selectors };

    logger.info(`Successfully saved selectors to ${resolvedPath}`);
  } catch (error) {
    logger.error(`Error saving selectors: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

/**
 * Get selectors for a specific category
 * @param category The category to get selectors for
 * @returns Array of selectors for the category
 */
export function getSelectors(category: string): string[] {
  return currentSelectors[category] || defaultSelectors[category] || [];
}

/**
 * Get all selectors
 * @returns All current selectors
 */
export function getAllSelectors(): LinkedInSelectors {
  return { ...currentSelectors };
}

/**
 * Update selectors for a specific category
 * @param category The category to update
 * @param selectors The new selectors for the category
 */
export function updateCategorySelectors(category: string, selectors: string[]): void {
  currentSelectors[category] = selectors;
}

/**
 * Initialize selectors from file
 * @param filePath Path to the selectors JSON file
 */
export async function initializeSelectors(filePath: string): Promise<void> {
  setSelectorsFilePath(filePath);
  await loadSelectors(filePath);
}
