import { WebDriver, By, WebElement } from 'selenium-webdriver';
import logger from '../../utils/logger';

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

  /**
   * Selector categories and their selectors
   */
  private readonly selectorMap = {
    'Profile Name': [
      'h1.text-heading-xlarge.inline.t-24.v-align-middle.break-words',
      'h1.text-heading-xlarge',
      'h1.pv-text-details__title--main',
      'h1.top-card-layout__title',
      'h1.profile-topcard-person-entity__name',
      'h1.artdeco-entity-lockup__title',
      'div.pv-text-details__left-panel h1'
    ],
    'Profile Headline': [
      'div.pv-text-details__left-panel div.text-body-medium',
      'div.ph5 div.text-body-medium',
      'div.pv-text-details__title div.text-body-medium',
      'div.profile-info div.text-body-medium',
      'div[data-field="headline"]',
      'div.profile-headline',
      'div.pv-top-card-section__headline'
    ],
    'Profile Location': [
      'div.pv-text-details__left-panel span.text-body-small.inline.t-black--light.break-words',
      'div.ph5 span.text-body-small.inline.t-black--light.break-words',
      'div.pv-text-details__title span.text-body-small.inline.t-black--light.break-words',
      'div.profile-info span.text-body-small.inline.t-black--light.break-words',
      'div[data-field="location"] span.text-body-small',
      'div.profile-location span.text-body-small',
      'div.pv-top-card-section__location'
    ],
    'About Section': [
      'section#about',
      'section[data-section="about"]',
      'section.artdeco-card.pv-profile-card.break-words',
      'div#about',
      'div[data-field="about"]',
      'div.pvs-list__outer-container'
    ],
    'Experience Section': [
      'section#experience',
      'section[data-section="experience"]',
      'section.artdeco-card.pv-profile-card.break-words',
      'div#experience',
      'div[data-field="experience"]',
      'div.pvs-list__outer-container'
    ],
    'Education Section': [
      'section#education',
      'section[data-section="education"]',
      'section.artdeco-card.pv-profile-card.break-words',
      'div#education',
      'div[data-field="education"]',
      'div.pvs-list__outer-container'
    ],
    'Recommendations Section': [
      'section#recommendations',
      'section.recommendations-section',
      'div[id*="recommendations"]',
      'section.artdeco-card.pv-profile-card.break-words.mt4',
      'div.pvs-list__outer-container[aria-label*="recommendation"]'
    ],
    'Profile Picture': [
      '.pv-top-card-profile-picture__image',
      '.profile-photo-edit__preview',
      '.pv-top-card__photo img',
      '.profile-picture img'
    ],
    'Background Image': [
      '.profile-background-image__image',
      '.pv-profile-top-card__background-image',
      '.profile-banner img',
      '.pv-cover-photo'
    ],
    'Recommendation Text': [
      '.pvs-entity__description-text',
      '.pv-recommendation-entity__text',
      '.artdeco-list__item-description',
      'div.inline-show-more-text span[aria-hidden="true"]',
      'div[data-field="recommendation_text"]'
    ],
    'Recommendation Author': [
      '.pvs-entity__title-text',
      '.pv-recommendation-entity__detail__title',
      '.artdeco-list__item-title',
      'a[data-field="recommender"]',
      'span.hoverable-link-text'
    ],
    'Skills': [
      'li.artdeco-list__item',
      'div.pvs-entity',
      'div.pv-skill-category-entity',
      'div.pv-profile-section__card-item',
      'div.pv-entity__summary-info',
      'div.skill-item'
    ]
  };

  /**
   * Test all selectors against a live page
   * @param driver WebDriver instance
   */
  public async testAllSelectors(driver: WebDriver): Promise<void> {
    logger.info('🔍 Starting selector verification...');

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
   * @returns Map of selector health metrics
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
   * Log health metrics to console
   */
  public logHealthMetrics(): void {
    logger.info('=== SELECTOR HEALTH METRICS ===');

    // Group by category
    const categorizedMetrics = new Map<string, SelectorHealthMetrics[]>();

    for (const metrics of this.healthMetrics.values()) {
      if (!categorizedMetrics.has(metrics.category)) {
        categorizedMetrics.set(metrics.category, []);
      }
      categorizedMetrics.get(metrics.category)?.push(metrics);
    }

    // Log each category
    for (const [category, metrics] of categorizedMetrics.entries()) {
      logger.info(`\n📋 CATEGORY: ${category}`);

      // Sort by success rate (descending)
      metrics.sort((a, b) => b.successRate - a.successRate);

      for (const metric of metrics) {
        const totalAttempts = metric.successCount + metric.failureCount;
        const successRateFormatted = (metric.successRate * 100).toFixed(0);
        const status = metric.successRate >= 0.7 ? '✅' :
                      metric.successRate >= 0.3 ? '⚠️' : '❌';

        logger.info(`${status} Selector: ${metric.selector}`);
        logger.info(`   Success Rate: ${successRateFormatted}% (${metric.successCount}/${totalAttempts})`);

        if (metric.lastText) {
          logger.info(`   Last Text: "${metric.lastText}"`);
        }
      }
    }

    logger.info('================================');
  }

  /**
   * Get the best performing selector for a category
   * @param category Selector category
   * @returns Best performing selector or undefined if none found
   */
  public getBestSelector(category: string): string | undefined {
    let bestSelector: string | undefined;
    let bestSuccessRate = -1;

    for (const [selector, metrics] of this.healthMetrics.entries()) {
      if (metrics.category === category &&
          metrics.successRate > bestSuccessRate &&
          metrics.successCount > 0) {
        bestSuccessRate = metrics.successRate;
        bestSelector = selector;
      }
    }

    return bestSelector;
  }

  /**
   * Get all selectors for a category with success rate above threshold
   * @param category Selector category
   * @param threshold Success rate threshold (0-1)
   * @returns Array of working selectors
   */
  public getWorkingSelectors(category: string, threshold = 0.3): string[] {
    const workingSelectors: string[] = [];

    for (const [selector, metrics] of this.healthMetrics.entries()) {
      if (metrics.category === category &&
          metrics.successRate >= threshold &&
          metrics.successCount > 0) {
        workingSelectors.push(selector);
      }
    }

    return workingSelectors;
  }
}
