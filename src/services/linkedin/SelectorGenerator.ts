import { WebDriver, By, WebElement } from 'selenium-webdriver';
import logger from '../../utils/logger';
import * as selectorsUtil from '../../utils/selectors';

/**
 * Class for generating and recommending CSS selectors from HTML analysis
 */
export class SelectorGenerator {
  private driver: WebDriver;
  private baseSelectors: Record<string, string[]> = {
    'Profile Name': [
      'h1',
      'h1.text-heading-xlarge',
      'div[data-member-id] h1',
      '.pv-top-card h1',
      'div.profile-info h1'
    ],
    'Profile Headline': [
      'h2',
      '.text-body-medium',
      'div.text-body-medium',
      '.pv-text-details__left-panel .text-body-medium',
      '.ph5 .text-body-medium'
    ],
    'Profile Location': [
      '.pv-text-details__left-panel .text-body-small',
      '.ph5 .text-body-small',
      'span.text-body-small',
      '.profile-location',
      'div.location'
    ],
    'About Section': [
      'section#about',
      'section[data-section="about"]',
      'div.summary-section',
      '[data-component="about-section"]',
      '.about-section'
    ],
    'Experience Section': [
      'section#experience',
      'section[data-section="experience"]',
      '[data-component="experience-section"]',
      '.experience-section',
      '.pvs-list__outer-container'
    ],
    'Education Section': [
      'section#education',
      'section[data-section="education"]',
      '[data-component="education-section"]',
      '.education-section',
      'div.education'
    ],
    'Skills': [
      'section#skills',
      'section[data-section="skills"]',
      '[data-component="skills-section"]',
      '.skills-section',
      'div.skill-category'
    ]
  };

  constructor(driver: WebDriver) {
    this.driver = driver;
  }

  /**
   * Generate new selectors for a category based on HTML analysis
   * @param category Category to generate selectors for
   * @returns Array of potential new selectors
   */
  public async generateSelectorsForCategory(category: string): Promise<string[]> {
    logger.info(`Generating selectors for category: ${category}`);

    // Get base selectors for this category or use defaults
    const baseSelectors = this.baseSelectors[category] || [];
    if (baseSelectors.length === 0) {
      logger.warn(`No base selectors found for category ${category}`);
      return [];
    }

    const generatedSelectors: string[] = [];

    // Try different strategies to find elements
    try {
      // 1. Try existing selectors from the default set
      for (const selector of baseSelectors) {
        try {
          const elements = await this.driver.findElements(By.css(selector));
          if (elements.length > 0) {
            generatedSelectors.push(selector);

            // 2. Try to enhance the selector with more specific attributes
            const enhancedSelectors = await this.enhanceSelector(selector, elements[0]);
            generatedSelectors.push(...enhancedSelectors);
          }
        } catch (error) {
          // Continue to the next selector
        }
      }

      // 3. Try to find elements using semantic search
      await this.addSemanticSelectors(category, generatedSelectors);

    } catch (error) {
      logger.error(`Error generating selectors for ${category}: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Remove duplicates
    const uniqueSelectors = Array.from(new Set(generatedSelectors));
    logger.info(`Generated ${uniqueSelectors.length} potential selectors for category ${category}`);

    return uniqueSelectors;
  }

  /**
   * Generate selectors for multiple categories
   * @param categories Categories to generate selectors for
   * @returns Record of category to generated selectors
   */
  public async generateSelectorsForCategories(categories: string[]): Promise<Record<string, string[]>> {
    const result: Record<string, string[]> = {};
    for (const category of categories) {
      result[category] = await this.generateSelectorsForCategory(category);
    }
    return result;
  }

  /**
   * Enhanced an existing selector with more specific attributes
   * @param baseSelector Base CSS selector
   * @param element Found element to analyze
   * @returns Enhanced selectors with more specificity
   */
  private async enhanceSelector(baseSelector: string, element: WebElement): Promise<string[]> {
    const enhanced: string[] = [];

    try {
      // Get attributes that can help make selectors more specific
      const classVal = await element.getAttribute('class');
      const id = await element.getAttribute('id');
      const role = await element.getAttribute('role');
      const dataTestId = await element.getAttribute('data-test-id');
      const ariaLabel = await element.getAttribute('aria-label');

      // Add class-based selectors
      if (classVal) {
        const classes = classVal.trim().split(/\s+/);
        if (classes.length > 0) {
          // Add individual class selectors
          for (const cls of classes) {
            if (cls && cls.length > 2) { // Ignore very short class names
              enhanced.push(`${baseSelector.split('.')[0]}.${cls}`);
            }
          }

          // Add combinations of classes for more specificity
          if (classes.length >= 2) {
            for (let i = 0; i < classes.length - 1; i++) {
              for (let j = i + 1; j < classes.length; j++) {
                if (classes[i] && classes[j] && classes[i].length > 2 && classes[j].length > 2) {
                  enhanced.push(`${baseSelector.split('.')[0]}.${classes[i]}.${classes[j]}`);
                }
              }
            }
          }
        }
      }

      // Add ID-based selector
      if (id) {
        enhanced.push(`#${id}`);
      }

      // Add attribute-based selectors
      if (dataTestId) {
        enhanced.push(`[data-test-id="${dataTestId}"]`);
      }

      if (role) {
        enhanced.push(`[role="${role}"]`);
      }

      if (ariaLabel) {
        enhanced.push(`[aria-label="${ariaLabel}"]`);
      }

      // Get hierarchical info for context selectors
      const parentElement = await element.findElement(By.xpath('..'));
      const parentClass = await parentElement.getAttribute('class');
      const parentId = await parentElement.getAttribute('id');

      // Add parent-child selectors
      if (parentClass) {
        const parentClasses = parentClass.trim().split(/\s+/);
        for (const cls of parentClasses) {
          if (cls && cls.length > 2) {
            enhanced.push(`.${cls} > ${baseSelector}`);
          }
        }
      }

      if (parentId) {
        enhanced.push(`#${parentId} > ${baseSelector}`);
      }

    } catch (error) {
      // Some attributes might not be available, continue with what we have
    }

    return enhanced;
  }

  /**
   * Add selectors based on semantic search (looking for text content that matches the category)
   * @param category Category to generate selectors for
   * @param selectors Array to add new selectors to
   */
  private async addSemanticSelectors(category: string, selectors: string[]): Promise<void> {
    try {
      const keywords = this.getCategoryKeywords(category);
      if (keywords.length === 0) return;

      // Search for elements containing these keywords
      for (const keyword of keywords) {
        try {
          const xpathQuery = `//*[contains(text(), "${keyword}")]`;
          const elements = await this.driver.findElements(By.xpath(xpathQuery));

          for (const element of elements) {
            // Convert found element to a CSS selector
            const tagName = await element.getTagName();
            const classList = await element.getAttribute('class');
            const id = await element.getAttribute('id');

            if (id) {
              selectors.push(`#${id}`);
            } else if (classList) {
              const classes = classList.trim().split(/\s+/);
              if (classes.length > 0 && classes[0]) {
                selectors.push(`${tagName}.${classes[0]}`);

                // Try with parent for more context
                try {
                  const parent = await element.findElement(By.xpath('..'));
                  const parentTag = await parent.getTagName();
                  selectors.push(`${parentTag} > ${tagName}.${classes[0]}`);
                } catch (e) {
                  // Ignore parent errors
                }
              }
            }
          }
        } catch (error) {
          // Continue to the next keyword
        }
      }
    } catch (error) {
      logger.error(`Error in semantic search: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get keywords associated with a category for semantic search
   * @param category Category to get keywords for
   * @returns Array of keywords
   */
  private getCategoryKeywords(category: string): string[] {
    switch (category) {
      case 'Profile Name':
        return ['name', 'profile', 'title'];
      case 'Profile Headline':
        return ['headline', 'title', 'position', 'occupation'];
      case 'Profile Location':
        return ['location', 'region', 'city', 'country'];
      case 'About Section':
        return ['about', 'summary', 'overview'];
      case 'Experience Section':
        return ['experience', 'work', 'employment', 'job'];
      case 'Education Section':
        return ['education', 'university', 'college', 'school', 'degree'];
      case 'Skills':
        return ['skills', 'expertise', 'proficiency', 'competency'];
      default:
        return [];
    }
  }

  /**
   * Test a set of generated selectors and return only those that work
   * @param category Category the selectors belong to
   * @param selectors Selectors to test
   * @returns Array of working selectors
   */
  public async testGeneratedSelectors(category: string, selectors: string[]): Promise<string[]> {
    const workingSelectors: string[] = [];

    for (const selector of selectors) {
      try {
        const elements = await this.driver.findElements(By.css(selector));
        if (elements.length > 0) {
          // Try to get text to verify it's useful
          try {
            const text = await elements[0].getText();
            const isDisplayed = await elements[0].isDisplayed();

            // Only include selectors that find visible elements with content
            if (isDisplayed && text && text.trim().length > 0) {
              workingSelectors.push(selector);
              logger.debug(`Generated selector works: ${selector} (category: ${category})`);
            }
          } catch (e) {
            // Element might not have accessible text
          }
        }
      } catch (error) {
        // Selector doesn't work, skip it
      }
    }

    return workingSelectors;
  }
}