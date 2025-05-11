import { WebDriver, By, WebElement } from 'selenium-webdriver';
import logger from '../../utils/logger';
import * as selectorsUtil from '../../utils/selectors';

/**
 * Interface for selector health metrics
 */
export interface SelectorHealthMetrics {
  selector: string;
  category: string;
  successCount: number;
  failureCount: number;
  successRate: number;
  lastSuccess?: Date;
  lastFailure?: Date;
  lastText?: string;
}

/**
 * Class to verify and track the health of selectors
 */
export class SelectorVerifier {
  private healthMetrics = new Map<string, SelectorHealthMetrics>();
  private selectorMap: selectorsUtil.LinkedInSelectors;

  /**
   * Constructor
   */
  constructor() {
    // Initialize with default selectors
    this.selectorMap = selectorsUtil.getAllSelectors();
  }

  /**
   * Refresh selectors from the central utility
   */
  public refreshSelectors(): void {
    this.selectorMap = selectorsUtil.getAllSelectors();
  }

  /**
   * Test all selectors against a live page
   * @param driver WebDriver instance
   */
  public async testAllSelectors(driver: WebDriver): Promise<void> {
    logger.info('🔍 Starting selector verification...');

    // Refresh selectors to ensure we have the latest
    this.refreshSelectors();

    for (const [category, selectors] of Object.entries(this.selectorMap)) {
      logger.info(`Testing selectors for category: ${category}`);
      let foundValidSelector = false;

      for (const selector of selectors) {
        await this.testSelector(driver, selector, category);
        const metrics = this.healthMetrics.get(selector);

        if (metrics && metrics.successRate > 0) {
          foundValidSelector = true;
        }
      }

      if (!foundValidSelector) {
        logger.warn(`⚠️ No working selectors found for category: ${category}`);
      }
    }

    logger.info('✅ Selector verification complete');
    this.logHealthMetrics();
  }

  /**
   * Test a specific selector
   * @param driver WebDriver instance
   * @param selector CSS selector
   * @param category Selector category
   * @returns true if selector found elements, false otherwise
   */
  public async testSelector(driver: WebDriver, selector: string, category: string): Promise<boolean> {
    try {
      const startTime = Date.now();
      const elements = await driver.findElements(By.css(selector));
      const foundElements = elements.length;

      if (foundElements > 0) {
        // Try to get text from the first element
        let text = '';
        let isDisplayed = false;

        try {
          isDisplayed = await elements[0].isDisplayed();
          if (isDisplayed) {
            text = await elements[0].getText();
          }
        } catch (error) {
          // Element might not be visible or interactive
        }

        const executionTime = Date.now() - startTime;

        this.updateSelectorHealth(selector, category, true, {
          foundElements,
          isDisplayed,
          text: text.substring(0, 50), // Truncate long text
          executionTime
        });

        logger.debug(`✅ Selector "${selector}" (${category}): Found ${foundElements} elements in ${executionTime}ms, First element visible: ${isDisplayed}`);
        return true;
      } else {
        this.updateSelectorHealth(selector, category, false);
        logger.debug(`❌ Selector "${selector}" (${category}): No elements found`);
        return false;
      }
    } catch (error) {
      this.updateSelectorHealth(selector, category, false);
      logger.debug(`❌ Selector "${selector}" (${category}): Error - ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * Update health metrics for a selector
   * @param selector CSS selector
   * @param category Selector category
   * @param success Whether the selector was successful
   * @param details Optional details about the selector test
   */
  public updateSelectorHealth(
    selector: string,
    category: string,
    success: boolean,
    details?: {
      foundElements?: number;
      isDisplayed?: boolean;
      text?: string;
      executionTime?: number;
    }
  ): void {
    const metrics = this.healthMetrics.get(selector) || {
      selector,
      category,
      successCount: 0,
      failureCount: 0,
      successRate: 0
    };

    if (success) {
      metrics.successCount++;
      metrics.lastSuccess = new Date();
      if (details?.text) {
        metrics.lastText = details.text;
      }
    } else {
      metrics.failureCount++;
      metrics.lastFailure = new Date();
    }

    const totalAttempts = metrics.successCount + metrics.failureCount;
    metrics.successRate = totalAttempts > 0 ? metrics.successCount / totalAttempts : 0;

    this.healthMetrics.set(selector, metrics);

    // Log warning if success rate drops below threshold
    if (totalAttempts > 5 && metrics.successRate < 0.3) {
      logger.warn(`⚠️ Selector "${selector}" (${category}) has low success rate: ${(metrics.successRate * 100).toFixed(0)}%`);
    }
  }

  /**
   * Get health metrics for all selectors
   * @returns Map of selector to health metrics
   */
  public getHealthMetrics(): Map<string, SelectorHealthMetrics> {
    return this.healthMetrics;
  }

  /**
   * Reset health metrics
   */
  public resetHealthMetrics(): void {
    this.healthMetrics.clear();
  }

  /**
   * Log health metrics
   */
  public logHealthMetrics(): void {
    let goodSelectors = 0;
    let poorSelectors = 0;
    let brokenSelectors = 0;

    const categoryStats: Record<string, { good: number; poor: number; broken: number }> = {};

    for (const metrics of this.healthMetrics.values()) {
      if (!categoryStats[metrics.category]) {
        categoryStats[metrics.category] = { good: 0, poor: 0, broken: 0 };
      }

      const stats = categoryStats[metrics.category];

      if (metrics.successRate > 0.7) {
        goodSelectors++;
        stats.good++;
      } else if (metrics.successRate > 0) {
        poorSelectors++;
        stats.poor++;
      } else {
        brokenSelectors++;
        stats.broken++;
      }
    }

    logger.info('📊 Selector Health Metrics Summary:');
    logger.info(`Total selectors checked: ${this.healthMetrics.size}`);
    logger.info(`✅ Good selectors (>70% success): ${goodSelectors}`);
    logger.info(`⚠️ Poor selectors (1-70% success): ${poorSelectors}`);
    logger.info(`❌ Broken selectors (0% success): ${brokenSelectors}`);

    logger.info('📊 Selector Health by Category:');
    for (const [category, stats] of Object.entries(categoryStats)) {
      logger.info(`${category}: ✅ ${stats.good} good, ⚠️ ${stats.poor} poor, ❌ ${stats.broken} broken`);
    }
  }

  /**
   * Get the best selector for a category
   * @param category Selector category
   * @returns Best selector for the category, or undefined if none found
   */
  public getBestSelector(category: string): string | undefined {
    let bestSelector: string | undefined;
    let bestScore = -1;

    for (const [selector, metrics] of this.healthMetrics.entries()) {
      if (metrics.category === category && metrics.successRate > bestScore) {
        bestScore = metrics.successRate;
        bestSelector = selector;
      }
    }

    if (bestSelector && bestScore > 0) {
      return bestSelector;
    }

    // Fall back to the first selector in the category if we don't have metrics
    const categorySelectors = this.selectorMap[category];
    return categorySelectors && categorySelectors.length > 0 ? categorySelectors[0] : undefined;
  }

  /**
   * Get working selectors for a category
   * @param category Selector category
   * @param threshold Minimum success rate (default 0.3)
   * @returns Array of working selectors
   */
  public getWorkingSelectors(category: string, threshold = 0.3): string[] {
    const workingSelectors: string[] = [];

    for (const [selector, metrics] of this.healthMetrics.entries()) {
      if (metrics.category === category && metrics.successRate >= threshold) {
        workingSelectors.push(selector);
      }
    }

    // Sort by success rate (highest first)
    workingSelectors.sort((a, b) => {
      const metricsA = this.healthMetrics.get(a);
      const metricsB = this.healthMetrics.get(b);
      if (!metricsA || !metricsB) return 0;
      return metricsB.successRate - metricsA.successRate;
    });

    return workingSelectors;
  }
}
