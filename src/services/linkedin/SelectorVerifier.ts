import { WebDriver, By, WebElement } from 'selenium-webdriver';
import logger from '../../utils/logger';
import { LinkedInSelectors, SelectorConfig, getSelectors, getAllSelectors, getXPathSelectors, getCssSelectors } from '../../constants/selectors';
import path from 'path';
import fs from 'fs/promises';

/**
 * Interface for selector health metrics
 */
export interface SelectorHealthMetrics {
  selector: string;
  selectorType: 'xpath' | 'css';
  category: string;
  successCount: number;
  failureCount: number;
  successRate: number;
  lastSuccess?: Date;
  lastFailure?: Date;
  lastText?: string;
  description?: string;
}

/**
 * Class to verify and track the health of selectors
 */
export class SelectorVerifier {
  private healthMetrics = new Map<string, SelectorHealthMetrics>();
  private selectorMap: LinkedInSelectors;

  /**
   * Constructor
   */
  constructor() {
    this.selectorMap = getAllSelectors();
    this.initializeHealthMetrics();
  }

  /**
   * Initialize health metrics for all selectors
   */
  private initializeHealthMetrics(): void {
    // Initialize metrics for each selector
    for (const [category, selectors] of Object.entries(this.selectorMap)) {
      for (const selector of selectors) {
        // Initialize health metrics for XPath
        this.healthMetrics.set(selector.xpath, {
          selector: selector.xpath,
          selectorType: 'xpath',
          category,
          successCount: 0,
          failureCount: 0,
          successRate: 0,
          description: selector.description
        });

        // Initialize health metrics for CSS fallback if exists
        if (selector.css) {
          this.healthMetrics.set(selector.css, {
            selector: selector.css,
            selectorType: 'css',
            category,
            successCount: 0,
            failureCount: 0,
            successRate: 0,
            description: `CSS fallback for: ${selector.description}`
          });
        }
      }
    }
  }

  /**
   * Get all health metrics
   * @returns Map of selector health metrics
   */
  public getHealthMetrics(): Map<string, SelectorHealthMetrics> {
    return this.healthMetrics;
  }

  /**
   * Update health metrics for a selector
   * @param selector Selector string
   * @param category Category the selector belongs to
   * @param success Whether the selector was successful
   * @param context Optional context (e.g. text found)
   */
  public updateSelectorHealth(
    selector: string,
    category: string,
    success: boolean,
    context: { text?: string } = {}
  ): void {
    const metrics = this.healthMetrics.get(selector);

    if (!metrics) {
      // If this is a new selector, initialize it
      const isXPath = selector.startsWith('/');
      this.healthMetrics.set(selector, {
        selector,
        selectorType: isXPath ? 'xpath' : 'css',
        category,
        successCount: success ? 1 : 0,
        failureCount: success ? 0 : 1,
        successRate: success ? 1 : 0,
        lastSuccess: success ? new Date() : undefined,
        lastFailure: success ? undefined : new Date(),
        lastText: context.text
      });
      return;
    }

    // Update existing metrics
    metrics.successCount += success ? 1 : 0;
    metrics.failureCount += success ? 0 : 1;

    const totalAttempts = metrics.successCount + metrics.failureCount;
    metrics.successRate = totalAttempts > 0 ? metrics.successCount / totalAttempts : 0;

    if (success) {
      metrics.lastSuccess = new Date();
      if (context.text) {
        metrics.lastText = context.text;
      }
    } else {
      metrics.lastFailure = new Date();
    }
  }

  /**
   * Get the best working selector for a category
   * @param category Selector category
   * @param threshold Success rate threshold (default: 0.3)
   * @returns Best selector information or undefined if none found
   */
  public getBestSelector(category: string, threshold = 0.3): { selector: string; type: 'xpath' | 'css' } | undefined {
    // Find all selectors for this category with success rate >= threshold
    const workingSelectors: Array<{ selector: string; type: 'xpath' | 'css'; successRate: number }> = [];

    for (const [selector, metrics] of this.healthMetrics.entries()) {
      if (metrics.category === category && metrics.successRate >= threshold) {
        workingSelectors.push({
          selector,
          type: metrics.selectorType,
          successRate: metrics.successRate
        });
      }
    }

    // Sort by success rate (descending)
    workingSelectors.sort((a, b) => b.successRate - a.successRate);

    // Prioritize XPath selectors over CSS if they have similar success rates
    const xpathSelectors = workingSelectors.filter(s => s.type === 'xpath');
    const cssSelectors = workingSelectors.filter(s => s.type === 'css');

    // Always prefer XPath selectors if they're working well
    if (xpathSelectors.length > 0) {
      return {
        selector: xpathSelectors[0].selector,
        type: 'xpath'
      };
    }

    // Fall back to CSS selectors only if no XPath selectors are working
    if (cssSelectors.length > 0) {
      return {
        selector: cssSelectors[0].selector,
        type: 'css'
      };
    }

    // If no working selectors with good metrics, try to use a default XPath from our defined ones
    const xpathSelectorsList = getXPathSelectors(category);
    if (xpathSelectorsList.length > 0) {
      return {
        selector: xpathSelectorsList[0],
        type: 'xpath'
      };
    }

    // Last resort - try a CSS selector from our defined fallbacks
    const cssSelectorsList = getCssSelectors(category);
    if (cssSelectorsList.length > 0) {
      return {
        selector: cssSelectorsList[0],
        type: 'css'
      };
    }

    return undefined;
  }

  /**
   * Get all working selectors for a category
   * @param category Selector category
   * @param threshold Success rate threshold (default: 0.3)
   * @returns Array of selector strings
   */
  public getWorkingSelectors(category: string, threshold = 0.3): string[] {
    const workingSelectors: string[] = [];

    for (const [selector, metrics] of this.healthMetrics.entries()) {
      if (metrics.category === category && metrics.successRate >= threshold) {
        workingSelectors.push(selector);
      }
    }

    // Sort by success rate (descending)
    return workingSelectors.sort((a, b) => {
      const metricsA = this.healthMetrics.get(a);
      const metricsB = this.healthMetrics.get(b);

      if (!metricsA || !metricsB) return 0;
      return metricsB.successRate - metricsA.successRate;
    });
  }

  /**
   * Find element(s) using the best working selector for a category with optional screenshot capture
   * @param driver WebDriver instance
   * @param category Selector category
   * @param multiple Whether to return multiple elements
   * @param captureScreenshot Whether to take a screenshot with the element highlighted
   * @returns Element(s) found or undefined if not found
   */
  public async findElementByCategory(
    driver: WebDriver,
    category: string,
    multiple = false,
    captureScreenshot = false
  ): Promise<WebElement | WebElement[] | undefined> {
    // First try the best selector based on past performance
    const bestSelector = this.getBestSelector(category);

    if (bestSelector) {
      try {
        if (multiple) {
          let elements: WebElement[];
          if (bestSelector.type === 'xpath') {
            elements = await driver.findElements(By.xpath(bestSelector.selector));
          } else {
            elements = await driver.findElements(By.css(bestSelector.selector));
          }

          if (elements.length > 0) {
            // Update success metrics for this selector
            this.updateSelectorHealth(bestSelector.selector, category, true);

            // Capture screenshot if requested for the first element
            if (captureScreenshot && elements.length > 0) {
              await this.captureElementScreenshot(
                driver,
                elements[0],
                `found_${category}`,
                bestSelector.selector,
                bestSelector.type
              );
            }

            return elements;
          } else {
            // Update failure metrics for this selector
            this.updateSelectorHealth(bestSelector.selector, category, false);
          }
        } else {
          try {
            let element: WebElement;
            if (bestSelector.type === 'xpath') {
              element = await driver.findElement(By.xpath(bestSelector.selector));
            } else {
              element = await driver.findElement(By.css(bestSelector.selector));
            }

            // Update success metrics
            this.updateSelectorHealth(bestSelector.selector, category, true);

            // Capture screenshot if requested
            if (captureScreenshot) {
              await this.captureElementScreenshot(
                driver,
                element,
                `found_${category}`,
                bestSelector.selector,
                bestSelector.type
              );
            }

            return element;
          } catch (error) {
            // Update failure metrics
            this.updateSelectorHealth(bestSelector.selector, category, false);
          }
        }
      } catch (error) {
        // Update failure metrics
        this.updateSelectorHealth(bestSelector.selector, category, false);
      }
    }

    // If best selector didn't work or doesn't exist, try all XPath selectors for this category
    const xpathSelectors = getXPathSelectors(category);

    for (const xpath of xpathSelectors) {
      try {
        if (multiple) {
          const elements = await driver.findElements(By.xpath(xpath));
          if (elements.length > 0) {
            // Update metrics
            this.updateSelectorHealth(xpath, category, true);

            // Capture screenshot if requested for the first element
            if (captureScreenshot && elements.length > 0) {
              await this.captureElementScreenshot(
                driver,
                elements[0],
                `found_${category}_xpath`,
                xpath,
                'xpath'
              );
            }

            return elements;
          } else {
            this.updateSelectorHealth(xpath, category, false);
          }
        } else {
          try {
            const element = await driver.findElement(By.xpath(xpath));
            // Update metrics
            this.updateSelectorHealth(xpath, category, true);

            // Capture screenshot if requested
            if (captureScreenshot) {
              await this.captureElementScreenshot(
                driver,
                element,
                `found_${category}_xpath`,
                xpath,
                'xpath'
              );
            }

            return element;
          } catch (error) {
            this.updateSelectorHealth(xpath, category, false);
          }
        }
      } catch (error) {
        // Continue to next xpath
        this.updateSelectorHealth(xpath, category, false);
      }
    }

    // Last resort - try CSS fallback selectors only if XPath selectors failed
    const cssSelectors = getCssSelectors(category);

    for (const css of cssSelectors) {
      try {
        if (multiple) {
          const elements = await driver.findElements(By.css(css));
          if (elements.length > 0) {
            // Update metrics
            this.updateSelectorHealth(css, category, true);

            // Capture screenshot if requested for the first element
            if (captureScreenshot && elements.length > 0) {
              await this.captureElementScreenshot(
                driver,
                elements[0],
                `found_${category}_css`,
                css,
                'css'
              );
            }

            return elements;
          } else {
            this.updateSelectorHealth(css, category, false);
          }
        } else {
          try {
            const element = await driver.findElement(By.css(css));
            // Update metrics
            this.updateSelectorHealth(css, category, true);

            // Capture screenshot if requested
            if (captureScreenshot) {
              await this.captureElementScreenshot(
                driver,
                element,
                `found_${category}_css`,
                css,
                'css'
              );
            }

            return element;
          } catch (error) {
            this.updateSelectorHealth(css, category, false);
          }
        }
      } catch (error) {
        // Continue to next css
        this.updateSelectorHealth(css, category, false);
      }
    }

    // If we got here, no selectors worked
    logger.warn(`No working selectors found for category: ${category}`);

    // Take a screenshot of the full page to help debug why selectors failed
    if (captureScreenshot) {
      await this.capturePageScreenshot(driver, `failed_${category}_selectors`);
    }

    return undefined;
  }

  /**
   * Reset all health metrics
   */
  public resetHealthMetrics(): void {
    this.healthMetrics.clear();
    this.initializeHealthMetrics();
  }

  /**
   * Capture a screenshot with an element highlighted
   * @param driver WebDriver instance
   * @param element Element to highlight
   * @param label Label for the screenshot
   * @param selector Selector used to find the element
   * @param selectorType Type of selector (xpath or css)
   */
  private async captureElementScreenshot(
    driver: WebDriver,
    element: WebElement,
    label: string,
    selector: string,
    selectorType: 'xpath' | 'css'
  ): Promise<void> {
    try {
      // Create special directory for selector verification screenshots
      const targetDir = path.join(process.cwd(), 'data', 'selector-debug');
      await fs.mkdir(targetDir, { recursive: true });

      // Create a timestamp and get the URL
      const timestamp = new Date().toISOString().replace(/:/g, '_');
      let urlInfo = '';

      try {
        const currentUrl = await driver.getCurrentUrl();
        // Extract profile name or other identifying info if possible
        const profileMatch = currentUrl.match(/linkedin\.com\/(in|pub)\/([^\/]+)/);
        if (profileMatch && profileMatch[2]) {
          urlInfo = profileMatch[2] + '_';
        } else {
          const urlObj = new URL(currentUrl);
          urlInfo = urlObj.pathname.split('/').filter(Boolean).join('_').substring(0, 30) + '_';
        }
      } catch (error) {
        urlInfo = 'unknown_url_';
      }

      // Sanitize info
      urlInfo = urlInfo.replace(/[^a-zA-Z0-9_-]/g, '_');

      // Extract element text for better identification
      let elementText = '';
      try {
        elementText = await element.getText();
        if (elementText.length > 30) {
          elementText = elementText.substring(0, 30) + '...';
        }
        elementText = elementText.replace(/[^a-zA-Z0-9_-]/g, '_');
      } catch (error) {
        // Ignore errors getting text
      }

      // Create filename
      const filename = `selector_${label}_${selectorType}_${urlInfo}${elementText ? '_' + elementText : ''}_${timestamp}`;
      const screenshotPath = path.join(targetDir, `${filename}.png`);
      const detailsPath = path.join(targetDir, `${filename}.txt`);

      // Save the original state of the element
      let originalBorder = '';
      let originalBg = '';

      try {
        originalBorder = await driver.executeScript("return arguments[0].style.border", element) as string;
        originalBg = await driver.executeScript("return arguments[0].style.backgroundColor", element) as string;
      } catch (error) {
        // Ignore errors
      }

      // Highlight the element
      try {
        await driver.executeScript(
          "arguments[0].style.border='3px solid red'; arguments[0].style.backgroundColor='rgba(255,0,0,0.1)'",
          element
        );

        // Take screenshot
        const screenshot = await driver.executeScript("return arguments[0].ownerDocument.defaultView.scrollY", element);
        await driver.executeScript("arguments[0].scrollIntoView({behavior: 'auto', block: 'center'})", element);

        // Wait a moment for any scrolling to finish
        await new Promise(resolve => setTimeout(resolve, 500));

        // Take the screenshot
        const screenshotData = await driver.takeScreenshot();
        await fs.mkdir(path.dirname(screenshotPath), { recursive: true });
        await fs.writeFile(screenshotPath, screenshotData, 'base64');

        // Restore original element state
        await driver.executeScript(
          `arguments[0].style.border='${originalBorder}'; arguments[0].style.backgroundColor='${originalBg}'`,
          element
        );

        // Gather element details for the text file
        let details = `Selector Verification: ${label}\n`;
        details += `Timestamp: ${new Date().toISOString()}\n`;
        details += `Selector Type: ${selectorType}\n`;
        details += `Selector: ${selector}\n\n`;

        if (elementText) {
          details += `Element Text: ${elementText}\n`;
        }

        // Get element attributes
        try {
          const tagName = await element.getTagName();
          details += `Element Tag: ${tagName}\n`;

          // Get all attributes
          const attributes = await driver.executeScript(
            "let result = {}; " +
            "let attrs = arguments[0].attributes; " +
            "for(let i = 0; i < attrs.length; i++) { " +
            "  result[attrs[i].name] = attrs[i].value; " +
            "} " +
            "return result;",
            element
          ) as Record<string, string>;

          details += "Element Attributes:\n";
          for (const [key, value] of Object.entries(attributes)) {
            details += `  ${key}: ${value}\n`;
          }
        } catch (error) {
          details += `Error getting element details: ${error instanceof Error ? error.message : String(error)}\n`;
        }

        // Save details to text file
        await fs.writeFile(detailsPath, details);

        logger.info(`Captured element for ${label} at ${screenshotPath}`);
      } catch (error) {
        logger.warn(`Error capturing element screenshot: ${error instanceof Error ? error.message : String(error)}`);

        // Try to restore element state
        try {
          await driver.executeScript(
            `arguments[0].style.border='${originalBorder}'; arguments[0].style.backgroundColor='${originalBg}'`,
            element
          );
        } catch (restoreError) {
          // Ignore errors during restoration
        }
      }
    } catch (error) {
      logger.warn(`Error setting up element screenshot: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Capture a screenshot of the full page for debugging
   * @param driver WebDriver instance
   * @param label Label for the screenshot
   */
  private async capturePageScreenshot(
    driver: WebDriver,
    label: string
  ): Promise<void> {
    try {
      // Create special directory for selector verification screenshots
      const targetDir = path.join(process.cwd(), 'data', 'selector-debug');
      await fs.mkdir(targetDir, { recursive: true });

      // Create a timestamp and get the URL
      const timestamp = new Date().toISOString().replace(/:/g, '_');
      let urlInfo = '';
      let pageContent = '';

      try {
        const currentUrl = await driver.getCurrentUrl();
        const pageTitle = await driver.getTitle();
        urlInfo = currentUrl.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50) + '_';
        pageContent = `URL: ${currentUrl}\nTitle: ${pageTitle}\n`;
      } catch (error) {
        urlInfo = 'unknown_url_';
      }

      // Create filename
      const filename = `page_${label}_${timestamp}`;
      const screenshotPath = path.join(targetDir, `${filename}.png`);
      const htmlPath = path.join(targetDir, `${filename}.html`);
      const infoPath = path.join(targetDir, `${filename}.txt`);

      // Take the screenshot
      const screenshotData = await driver.takeScreenshot();
      await fs.writeFile(screenshotPath, screenshotData, 'base64');

      // Save HTML and info
      try {
        const html = await driver.getPageSource();
        await fs.writeFile(htmlPath, html);

        // Gather page details
        pageContent += `Timestamp: ${new Date().toISOString()}\n`;
        pageContent += `Selector Debug Purpose: ${label}\n`;

        await fs.writeFile(infoPath, pageContent);

        logger.info(`Captured full page for ${label} at ${screenshotPath}`);
      } catch (error) {
        logger.warn(`Error saving page HTML: ${error instanceof Error ? error.message : String(error)}`);
      }
    } catch (error) {
      logger.warn(`Error capturing page screenshot: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Find an element within a specific parent context element by category
   * Similar to findElementByCategory but scopes the search to a specific parent element
   *
   * @param parentElement The parent WebElement to search within
   * @param category Selector category
   * @param multiple Whether to return multiple elements
   * @param captureScreenshot Whether to capture a screenshot for debugging
   * @returns The found WebElement(s) or undefined if not found
   */
  public async findElementWithinContext(
    parentElement: WebElement,
    category: string,
    multiple = false,
    captureScreenshot = false
  ): Promise<WebElement | WebElement[] | undefined> {
    // Get all selectors for the category
    const xpathSelectors = getXPathSelectors(category);
    const cssSelectors = getCssSelectors(category);

    const allSelectors = [...xpathSelectors.map(s => ({ selector: s, type: 'xpath' as const }))];

    // Prioritize selectors with good health metrics
    allSelectors.sort((a, b) => {
      const metricsA = this.healthMetrics.get(a.selector);
      const metricsB = this.healthMetrics.get(b.selector);

      if (!metricsA && !metricsB) return 0;
      if (!metricsA) return 1;
      if (!metricsB) return -1;

      return metricsB.successRate - metricsA.successRate;
    });

    // Try each selector in order
    for (const { selector, type } of allSelectors) {
      try {
        let elements: WebElement[] = [];

        if (type === 'xpath') {
          elements = await parentElement.findElements(By.xpath(selector));
        } else {
          elements = await parentElement.findElements(By.css(selector));
        }

        if (elements.length > 0) {
          // Update health metrics
          this.updateSelectorHealth(selector, category, true);

          // Return the result
          if (multiple) {
            return elements;
          } else {
            return elements[0];
          }
        } else {
          this.updateSelectorHealth(selector, category, false);
        }
      } catch (error) {
        this.updateSelectorHealth(selector, category, false);
        logger.debug(`Error with ${type} selector "${selector}" in category "${category}": ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // Try using CSS selectors as fallback
    if (cssSelectors.length > 0) {
      for (const selector of cssSelectors) {
        try {
          const elements = await parentElement.findElements(By.css(selector));

          if (elements.length > 0) {
            this.updateSelectorHealth(selector, category, true);

            if (multiple) {
              return elements;
            } else {
              return elements[0];
            }
          } else {
            this.updateSelectorHealth(selector, category, false);
          }
        } catch (error) {
          this.updateSelectorHealth(selector, category, false);
        }
      }
    }

    logger.debug(`No working selectors found for category "${category}" within context element`);
    return multiple ? [] : undefined;
  }
}
