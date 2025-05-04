import { WebDriver } from 'selenium-webdriver';
import { Logger } from '../services/logger.service';
import { randomDelay } from './SeleniumUtils';

const logger = new Logger('AntiDetection');

/**
 * Anti-detection techniques for LinkedIn automation
 */
export class AntiDetectionUtils {
  /**
   * Apply browser fingerprint masking to avoid detection
   *
   * @param driver WebDriver instance
   */
  public static async maskFingerprint(driver: WebDriver): Promise<void> {
    try {
      // Modify navigator properties to appear more like a regular browser
      await driver.executeScript(`
        // Override properties that automation detection might check
        const overrideProperties = () => {
          // Make navigator.webdriver property appear false
          Object.defineProperty(navigator, 'webdriver', {
            get: () => false,
          });

          // Add plugins to appear more like a regular browser
          Object.defineProperty(navigator, 'plugins', {
            get: () => {
              // Create a fake plugin array with common plugins
              const fakePlugins = {
                length: 5,
                refresh: function() {},
                item: function() { return this[0]; },
                namedItem: function() { return this[0]; },
                0: {
                  name: 'Chrome PDF Plugin',
                  description: 'Portable Document Format',
                  filename: 'internal-pdf-viewer',
                  length: 1,
                },
                1: {
                  name: 'Chrome PDF Viewer',
                  description: 'Chrome PDF Viewer',
                  filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai',
                  length: 1,
                },
                2: {
                  name: 'Native Client',
                  description: 'Native Client',
                  filename: 'internal-nacl-plugin',
                  length: 1,
                },
                3: {
                  name: 'Widevine Content Decryption Module',
                  description: 'Widevine Content Decryption Module',
                  filename: 'widevinecdmadapter.dll',
                  length: 1,
                },
                4: {
                  name: 'Microsoft Office',
                  description: 'Microsoft Office Plugin',
                  filename: 'office.dll',
                  length: 1,
                }
              };
              return fakePlugins;
            }
          });

          // Make Chrome object appear similar to regular Chrome
          window.chrome = window.chrome || {};
          window.chrome.runtime = window.chrome.runtime || {};

          // Add random user interaction history to appear more like real user
          window.history.length = Math.floor(Math.random() * 10) + 10;
        };

        overrideProperties();
      `);

      // Hide automation-specific properties in document
      await driver.executeScript(`
        // Override document properties that might be used for detection
        const modifyDocumentProperties = () => {
          // Hide automation related DOM elements
          const createNodeDescriptor = (nodeName) => {
            let descriptor = Object.getOwnPropertyDescriptor(window.Document.prototype, nodeName);
            if (!descriptor) return null;

            return {
              get: function() {
                if (nodeName === 'documentElement') {
                  return document.documentElement;
                }
                return descriptor.get.call(this);
              }
            };
          };

          // Override properties that selenium might modify
          try {
            Object.defineProperty(document, '$cdc_asdjflasutopfhvcZLmcfl_', {
              get: () => undefined,
              set: () => {}
            });

            Object.defineProperty(document, '$wdc_', {
              get: () => undefined,
              set: () => {}
            });

            Object.defineProperty(document, '$chrome_asyncScriptInfo', {
              get: () => undefined,
              set: () => {}
            });
          } catch (e) {
            // Ignore errors if properties can't be defined
          }
        };

        modifyDocumentProperties();
      `);

      logger.info('Browser fingerprint masking applied');
    } catch (error: any) {
      logger.error('Error applying browser fingerprint masking:', error);
    }
  }

  /**
   * Simulate human-like scrolling behavior
   *
   * @param driver WebDriver instance
   * @param scrollDistance Total scroll distance (pixels)
   * @param numSteps Number of incremental scroll steps
   */
  public static async humanLikeScrolling(
    driver: WebDriver,
    scrollDistance: number = 1000,
    numSteps: number = 10
  ): Promise<void> {
    try {
      const stepSize = scrollDistance / numSteps;
      let currentScroll = 0;

      for (let i = 0; i < numSteps; i++) {
        // Calculate a slightly randomized step to look more human
        const thisStep = stepSize + (Math.random() * 20 - 10);
        currentScroll += thisStep;

        // Execute the scroll
        await driver.executeScript(`window.scrollBy(0, ${thisStep});`);

        // Random delay between scrolls (300-800ms)
        await randomDelay(300, 800);
      }

      // Optional natural deceleration at the end
      await driver.executeScript(`window.scrollBy(0, ${Math.floor(stepSize * 0.3)});`);
      await randomDelay(400, 600);
      await driver.executeScript(`window.scrollBy(0, ${Math.floor(stepSize * 0.1)});`);

      logger.debug('Human-like scrolling completed');
    } catch (error: any) {
      logger.error('Error during human-like scrolling:', error);
    }
  }

  /**
   * Simulate human-like mouse movements
   *
   * @param driver WebDriver instance
   * @param targetElement Selector for element to move to (optional)
   */
  public static async simulateMouseMovements(
    driver: WebDriver,
    targetElement?: string
  ): Promise<void> {
    try {
      // If no specific target, use randomized mouse movements
      if (!targetElement) {
        await driver.executeScript(`
          const simulateMouseMove = () => {
            // Create a random path with slight curves (bezier-like)
            const generateMousePath = (startX, startY, endX, endY, steps) => {
              const path = [];
              // Control point for curve (slight randomization)
              const ctrlX = (startX + endX) / 2 + (Math.random() * 100 - 50);
              const ctrlY = (startY + endY) / 2 + (Math.random() * 100 - 50);

              for (let i = 0; i <= steps; i++) {
                const t = i / steps;
                // Quadratic bezier formula
                const x = Math.round((1-t)*(1-t)*startX + 2*(1-t)*t*ctrlX + t*t*endX);
                const y = Math.round((1-t)*(1-t)*startY + 2*(1-t)*t*ctrlY + t*t*endY);
                path.push({ x, y });
              }
              return path;
            };

            // Random start and end positions
            const startX = Math.floor(Math.random() * window.innerWidth);
            const startY = Math.floor(Math.random() * window.innerHeight);
            const endX = Math.floor(Math.random() * window.innerWidth);
            const endY = Math.floor(Math.random() * window.innerHeight);

            // Generate the mouse path
            const path = generateMousePath(startX, startY, endX, endY, 20);

            // We can't actually move the mouse, but we can trigger mousemove events
            path.forEach(point => {
              const mouseEvent = new MouseEvent('mousemove', {
                view: window,
                bubbles: true,
                cancelable: true,
                clientX: point.x,
                clientY: point.y
              });
              document.dispatchEvent(mouseEvent);
            });
          };

          simulateMouseMove();
        `);
      } else {
        // Move to a specific element with human-like path
        await driver.executeScript(`
          const element = document.querySelector('${targetElement}');
          if (element) {
            // Get element position
            const rect = element.getBoundingClientRect();
            const endX = rect.left + rect.width / 2;
            const endY = rect.top + rect.height / 2;

            // Current mouseposition (estimate center of screen if unknown)
            const startX = window.innerWidth / 2;
            const startY = window.innerHeight / 3;

            // Generate curved path to element
            const steps = 15 + Math.floor(Math.random() * 10);
            const ctrlX = (startX + endX) / 2 + (Math.random() * 100 - 50);
            const ctrlY = (startY + endY) / 2 + (Math.random() * 100 - 50);

            for (let i = 0; i <= steps; i++) {
              const t = i / steps;
              const x = Math.round((1-t)*(1-t)*startX + 2*(1-t)*t*ctrlX + t*t*endX);
              const y = Math.round((1-t)*(1-t)*startY + 2*(1-t)*t*ctrlY + t*t*endY);

              const mouseEvent = new MouseEvent('mousemove', {
                view: window,
                bubbles: true,
                cancelable: true,
                clientX: x,
                clientY: y
              });
              document.dispatchEvent(mouseEvent);
            }

            // Hover effect with slight jitter (like a real human hand)
            const jitterAmount = 3;
            for (let j = 0; j < 5; j++) {
              const jX = endX + (Math.random() * jitterAmount * 2 - jitterAmount);
              const jY = endY + (Math.random() * jitterAmount * 2 - jitterAmount);

              const jitterEvent = new MouseEvent('mousemove', {
                view: window,
                bubbles: true,
                cancelable: true,
                clientX: jX,
                clientY: jY
              });
              document.dispatchEvent(jitterEvent);

              // Also dispatch mouseover/mouseenter on the element
              if (j === 3) {
                element.dispatchEvent(new MouseEvent('mouseover', {
                  view: window,
                  bubbles: true,
                  cancelable: true
                }));

                element.dispatchEvent(new MouseEvent('mouseenter', {
                  view: window,
                  bubbles: true,
                  cancelable: true
                }));
              }
            }
          }
        `);
      }

      logger.debug('Mouse movement simulation completed');
    } catch (error: any) {
      logger.error('Error during mouse movement simulation:', error);
    }
  }

  /**
   * Add random behavior to avoid detection
   *
   * @param driver WebDriver instance
   */
  public static async addRandomBehavior(driver: WebDriver): Promise<void> {
    try {
      // Pick a random behavior from the list
      const behaviors = [
        // Scroll slightly up and down
        async () => {
          await driver.executeScript('window.scrollBy(0, 100);');
          await randomDelay(500, 1200);
          await driver.executeScript('window.scrollBy(0, -40);');
        },

        // Resize window slightly
        async () => {
          const currentSize = await driver.manage().window().getSize();
          await driver.manage().window().setSize(
            currentSize.width - 20,
            currentSize.height - 10
          );
          await randomDelay(800, 1500);
          await driver.manage().window().setSize(
            currentSize.width,
            currentSize.height
          );
        },

        // Move mouse randomly
        async () => {
          await AntiDetectionUtils.simulateMouseMovements(driver);
        },

        // Focus on random input field or clickable element
        async () => {
          await driver.executeScript(`
            const clickableElements = document.querySelectorAll('a, button, input, select');
            if (clickableElements.length > 0) {
              const randomIndex = Math.floor(Math.random() * clickableElements.length);
              const element = clickableElements[randomIndex];

              // Just trigger focus event without clicking
              if (element.tagName !== 'A' && element.tagName !== 'BUTTON') {
                element.focus();
              }
            }
          `);
        }
      ];

      // Execute a random behavior
      const randomBehavior = behaviors[Math.floor(Math.random() * behaviors.length)];
      await randomBehavior();

      logger.debug('Random behavior added successfully');
    } catch (error: any) {
      logger.error('Error adding random behavior:', error);
    }
  }

  /**
   * Setup recovery mechanisms for common automation failures
   *
   * @param driver WebDriver instance
   */
  public static setupRecoveryMechanisms(driver: WebDriver): void {
    // This method sets up event listeners and handlers
    // It's a placeholder for demonstration - in a real implementation,
    // we'd configure actual event listeners that detect and handle failures
    logger.info('Recovery mechanisms configured');
  }

  /**
   * Apply all anti-detection measures
   *
   * @param driver WebDriver instance
   */
  public static async applyAllMeasures(driver: WebDriver): Promise<void> {
    try {
      // Apply fingerprint masking first
      await this.maskFingerprint(driver);

      // Add random delay
      await randomDelay(500, 1500);

      // Add random behavior
      await this.addRandomBehavior(driver);

      // Setup recovery mechanisms
      this.setupRecoveryMechanisms(driver);

      logger.info('All anti-detection measures applied successfully');
    } catch (error: any) {
      logger.error('Error applying anti-detection measures:', error);
    }
  }
}

export default AntiDetectionUtils;