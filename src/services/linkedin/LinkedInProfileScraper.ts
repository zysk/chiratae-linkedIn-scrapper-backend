import fs from 'fs/promises';
import path from 'path';
import { Builder, By, Key, until, WebDriver, WebElement } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';
import { getXPathSelectors } from '../../constants/selectors';
import { ILinkedInAccount } from '../../models/linkedinAccount.model';
import { IProxy } from '../../models/proxy.model';
import { Endorsement, LinkedInProfileData } from '../../types/linkedin.types';
import { CONFIG } from '../../utils/config';
import { randomDelay } from '../../utils/delay';
import { normalizeLinkedInUrl } from '../../utils/linkedin.utils';
import logger from '../../utils/logger';
import WebDriverManager from '../selenium/WebDriverManager';
import linkedInAuthService from './LinkedInAuthService';
import { SelectorHealthMetrics, SelectorVerifier } from './SelectorVerifier';

interface Experience {
	title: string;
	company: string;
	dateRange: string;
	location: string;
	description: string;
}

interface Education {
	school: string;
	degree: string;
	fieldOfStudy: string;
	dateRange: string;
	description: string;
}

/**
 * Interface for education data
 */
interface EducationData {
	school: string;
	degree?: string;
	field?: string;
	startDate?: string;
	endDate?: string;
	description?: string;
}

/**
 * Interface for experience data
 */
interface ExperienceData {
	title: string;
	company: string;
	location?: string;
	startDate?: string;
	endDate?: string;
	description?: string;
	isCurrentRole?: boolean;
}

/**
 * Interface for contact information
 */
interface ContactInfo {
	email?: string;
	phone?: string;
	website?: string;
	twitter?: string;
	linkedin?: string;
}

/**
 * Interface for profile data
 */
export interface ProfileData {
	profileId: string;
	profileUrl: string;
	name: string;
	headline?: string;
	location?: string;
	summary?: string;
	currentPosition?: string;
	experienceArr?: ExperienceData[];
	educationArr?: EducationData[];
	contactInfo?: ContactInfo;
	skills?: string[];
	imageUrl?: string;
}

interface IScrapeResult {
	success: boolean;
	profileData?: LinkedInProfileData;
	message?: string;
}

interface LinkedInProfile {
	firstName?: string;
	lastName?: string;
	name: string;
	headline?: string;
	location?: string;
	about?: string;
	profilePictureUrl?: string;
	backgroundImageUrl?: string;
	experience: Experience[];
	education: Education[];
	skills: string[];
	certifications?: {
		name: string;
		issuingOrganization?: string;
		issueDate?: string;
		expirationDate?: string;
		credentialId?: string;
		credentialUrl?: string;
	}[];
	volunteering?: {
		role: string;
		organization: string;
		cause?: string;
		startDate?: string;
		endDate?: string;
		description?: string;
	}[];
	awards?: {
		title: string;
		issuer?: string;
		issueDate?: string;
		description?: string;
	}[];
	publications?: {
		title: string;
		publisher?: string;
		publicationDate?: string;
		description?: string;
		url?: string;
		authors?: string[];
	}[];
	recommendations?: {
		text: string;
		recommenderName?: string;
		recommenderTitle?: string;
		date?: string;
		relationship?: string;
	}[];
	interests?: {
		name: string;
		category?: string;
		followers?: number;
	}[];
	languages?: {
		language: string;
		proficiency?: string;
	}[];
	contactInfo?: {
		email?: string;
		phone?: string;
		birthday?: string;
		websites?: string[];
		twitter?: string;
	};
	endorsements?: Endorsement[];
	// Additional fields
	profileUrl: string;
	projects?: any[];
	connections?: number;
	timestamp?: string;
	campaignId?: string;
	metadataId?: string;
}

// Add LinkedInProfileBasic interface
interface LinkedInProfileBasic {
	profileUrl: string;
	name: string;
	headline: string;
	location: string;
	connectionDegree: string;
	metadataId: string;
}

// Extended LinkedIn account interface with password
interface LinkedInAccountWithPassword extends ILinkedInAccount {
	password?: string;
}

/**
 * LinkedInProfileScraper class
 * Service for scraping LinkedIn profiles
 */
export class LinkedInProfileScraper {
	private static instance: LinkedInProfileScraper;
	private webDriverManager: typeof WebDriverManager;
	private linkedInAuthService: typeof linkedInAuthService;
	private selectorVerifier: SelectorVerifier;

	/**
	 * Private constructor to enforce singleton pattern
	 */
	private constructor() {
		this.webDriverManager = WebDriverManager;
		this.linkedInAuthService = linkedInAuthService;
		this.selectorVerifier = new SelectorVerifier();
		logger.info('LinkedIn Profile Scraper initialized');
	}

	/**
	 * Get singleton instance
	 * @returns LinkedInProfileScraper instance
	 */
	public static getInstance(): LinkedInProfileScraper {
		if (!LinkedInProfileScraper.instance) {
			LinkedInProfileScraper.instance = new LinkedInProfileScraper();
		}
		return LinkedInProfileScraper.instance;
	}

	/**
	 * Scrape a LinkedIn profile
	 * @param profileUrl The LinkedIn profile URL to scrape
	 * @param campaignId Campaign ID for tracking and screenshots
	 * @param linkedInAccount LinkedIn account to use for authentication
	 * @param proxy Optional proxy to use for the request
	 * @returns Scraped LinkedIn profile data
	 */
	public async scrapeProfile(
		profileUrl: string,
		campaignId?: string,
		linkedInAccount?: ILinkedInAccount,
		proxy?: IProxy
	): Promise<LinkedInProfile> {
		const driver = await this.setupDriver(linkedInAccount, proxy);
		try {
			await this.navigateToProfile(driver, profileUrl, linkedInAccount);
			// No need to call scrollProfile here as it's already called inside navigateToProfile

			// Extract all profile sections
			const nameResult = await this.extractName(driver);
			const name = typeof nameResult === 'string' ? nameResult :
				nameResult?.firstName && nameResult?.lastName ?
					`${nameResult.firstName} ${nameResult.lastName}` :
					nameResult?.firstName || nameResult?.lastName || 'Unknown';

			const headline = await this.extractHeadline(driver);
			const location = await this.extractLocation(driver);
			const about = await this.extractAbout(driver);
			const experience = await this.extractExperience(driver);
			const education = await this.extractEducation(driver);
			const skills = await this.extractSkills(driver);
			const certifications = await this.extractCertifications(driver);
			const projects = await this.extractProjects(driver);
			const languages = await this.extractLanguages(driver);
			const connections = await this.extractConnections(driver);

			logger.info(`Profile scraping complete for: ${name || profileUrl}`);

			// Construct the profile object
			const profile: LinkedInProfile = {
				profileUrl,
				name,
				headline,
				location,
				about,
				experience,
				education,
				skills,
				certifications,
				projects,
				languages,
				connections,
				timestamp: new Date().toISOString(),
				// Additional fields
				campaignId: campaignId || '',
				metadataId: this.generateMetadataId(profileUrl)
			};

			// Clean up screenshots directory if needed
			await this.cleanupScreenshots();

			return profile;
		} catch (error) {
			logger.error(`Error scraping LinkedIn profile: ${error instanceof Error ? error.message : String(error)}`);
			throw error;
		} finally {
			try {
				if (driver) {
					await driver.quit();
					logger.info('Browser closed successfully');
				}
			} catch (closeError) {
				logger.warn(`Error closing browser: ${closeError instanceof Error ? closeError.message : String(closeError)}`);
			}
		}
	}

	/**
	 * Search LinkedIn profiles
	 * @param searchQuery The query to search for
	 * @param linkedInAccount LinkedIn account to use for authentication
	 * @param campaignId Campaign ID for tracking
	 * @param maxResults Maximum number of results to return
	 * @param proxy Optional proxy to use
	 * @returns Array of basic profile data
	 */
	public async searchProfiles(
		searchQuery: string,
		linkedInAccount: ILinkedInAccount,
		campaignId?: string,
		maxResults: number = 10,
		proxy?: IProxy
	): Promise<LinkedInProfileBasic[]> {
		const driver = await this.setupDriver(linkedInAccount, proxy);
		try {
			await this.login(driver, linkedInAccount);

			// Take a screenshot of the logged-in state for debugging
			await this.takeScreenshot(driver, 'logged-in-state');

			// Navigate to the search page
			await driver.get('https://www.linkedin.com/search/results/people/');
			await this.takeScreenshot(driver, 'search-page-initial');

			// Find and use the search input
			await this.findAndUseSearchInput(driver, searchQuery);

			// Wait for search results to load
			await driver.wait(until.elementLocated(By.xpath(
				"//div[contains(@class, 'search-results-container')]"
			)), 10000);

			await this.takeScreenshot(driver, 'search-results-loaded');

			// Extract profile data from search results
			const profiles = await this.extractProfilesFromSearch(driver, maxResults);
			logger.info(`Found ${profiles.length} profiles for search: "${searchQuery}"`);

			// Clean up screenshots directory
			await this.cleanupScreenshots();

			return profiles;
		} catch (error) {
			logger.error(`Error searching LinkedIn profiles: ${error instanceof Error ? error.message : String(error)}`);
			throw error;
		} finally {
			try {
				if (driver) {
					await driver.quit();
					logger.info('Browser closed successfully');
				}
			} catch (closeError) {
				logger.warn(`Error closing browser: ${closeError instanceof Error ? closeError.message : String(closeError)}`);
			}
		}
	}

	/**
	 * Clean up screenshots directory after scraping is complete
	 * Only deletes files older than the specified age (default: 24 hours)
	 */
	private async cleanupScreenshots(maxAgeHours: number = 24): Promise<void> {
		try {
			const screenshotsDir = path.join(process.cwd(), 'data', 'screenshots');
			const selectorDebugDir = path.join(process.cwd(), 'data', 'selector-debug');
			const elementScreenshotsDir = path.join(process.cwd(), 'data', 'element-screenshots');

			// Create an array of directories to clean
			const dirsToClean = [
				screenshotsDir,
				selectorDebugDir,
				elementScreenshotsDir
			];

			const now = new Date();
			const maxAgeMs = maxAgeHours * 60 * 60 * 1000; // Convert hours to milliseconds

			for (const dir of dirsToClean) {
				try {
					// Check if directory exists
					await fs.access(dir);

					// Get all files in the directory
					const files = await fs.readdir(dir);
					let deletedCount = 0;

					for (const file of files) {
						try {
							const filePath = path.join(dir, file);
							const stats = await fs.stat(filePath);

							// Check if the file is older than the max age
							if (now.getTime() - stats.mtime.getTime() > maxAgeMs) {
								await fs.unlink(filePath);
								deletedCount++;
							}
						} catch (fileError) {
							logger.warn(`Error processing file during cleanup: ${fileError instanceof Error ? fileError.message : String(fileError)}`);
						}
					}

					if (deletedCount > 0) {
						logger.info(`Cleaned up ${deletedCount} old files from ${path.basename(dir)}`);
					}
				} catch (dirError: unknown) {
					// Directory doesn't exist or can't be accessed, that's fine
					if (dirError instanceof Error) {
						// Check if it's just a "file not found" error which we can ignore
						const errorMessage = dirError.message || '';
						if (!errorMessage.includes('ENOENT') && !errorMessage.includes('no such file')) {
							logger.warn(`Error accessing directory during cleanup: ${dirError.message}`);
						}
					}
				}
			}
		} catch (error) {
			logger.warn(`Error cleaning up screenshots: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	/**
	 * Find and use the search input field
	 * @param driver WebDriver instance
	 * @param searchQuery The query to search for
	 */
	private async findAndUseSearchInput(driver: WebDriver, searchQuery: string): Promise<void> {
		try {
			// Try to find the search input using our selector verifier
			const searchInput = await this.selectorVerifier.findElementByCategory(
				driver,
				'Search Input',
				false,
				true // Take screenshot to debug
			) as WebElement;

			if (searchInput) {
				// Clear any existing text and enter the search query
				await searchInput.clear();
				await searchInput.sendKeys(searchQuery, Key.ENTER);
				logger.info(`Entered search query: "${searchQuery}"`);

				// Wait for search results to load
				await driver.sleep(3000);
				await this.takeScreenshot(driver, 'after-search-input');

				// Check if we need to click on the "People" tab
				try {
					const peopleTab = await this.selectorVerifier.findElementByCategory(
						driver,
						'People Tab',
						false,
						true // Take screenshot to debug
					) as WebElement;

					if (peopleTab) {
						await peopleTab.click();
						logger.info('Clicked on "People" tab');
						await driver.sleep(2000);
						await this.takeScreenshot(driver, 'after-people-tab-click');
					}
				} catch (tabError) {
					logger.warn(`Could not find or click "People" tab: ${tabError instanceof Error ? tabError.message : String(tabError)}`);
				}

				return;
			}

			// Fallback to direct search URL if the input field wasn't found
			logger.warn('Search input not found, using direct URL search');
			const encodedQuery = encodeURIComponent(searchQuery);
			await driver.get(`https://www.linkedin.com/search/results/people/?keywords=${encodedQuery}`);
			await driver.sleep(3000);
			await this.takeScreenshot(driver, 'direct-search-url');
		} catch (error) {
			logger.error(`Error finding/using search input: ${error instanceof Error ? error.message : String(error)}`);

			// Last resort: try direct URL
			const encodedQuery = encodeURIComponent(searchQuery);
			await driver.get(`https://www.linkedin.com/search/results/people/?keywords=${encodedQuery}`);
			await driver.sleep(3000);
			await this.takeScreenshot(driver, 'direct-search-url-fallback');
		}
	}

	/**
	 * Extract profile data from search results
	 * @param driver WebDriver instance
	 * @param maxResults Maximum number of results to return
	 * @returns Array of basic profile data
	 */
	private async extractProfilesFromSearch(
		driver: WebDriver,
		maxResults: number
	): Promise<LinkedInProfileBasic[]> {
		const profiles: LinkedInProfileBasic[] = [];
		let currentPage = 1;

		while (profiles.length < maxResults) {
			// Take a screenshot of the current search results page
			await this.takeScreenshot(driver, `search-results-page-${currentPage}`, true, 'debug-screenshots');
			logger.info(`Searching for profile cards on the page...`);

			// Find all profile cards using the selector verifier
			const profileCards = await this.selectorVerifier.findElementByCategory(
				driver,
				'Search Result Cards',
				true, // Get multiple
				true  // Take screenshot
			) as WebElement[];

			if (!profileCards || profileCards.length === 0) {
				logger.warn('No profile cards found with any selector');
				logger.warn(`No results found on page ${currentPage}. Taking screenshot for debugging.`);
				await this.takeScreenshot(driver, `empty-results-page-${currentPage}`, true, 'debug-screenshots');
				break;
			}

			logger.info(`Found ${profileCards.length} profile cards on page ${currentPage}`);

			// Process each profile card
			for (let i = 0; i < profileCards.length && profiles.length < maxResults; i++) {
				try {
					const card = profileCards[i];

					// Extract profile URL using SelectorVerifier
					const urlElement = await this.selectorVerifier.findElementWithinContext(
						card,
						'Search Result Profile URL',
						false
					);

					let profileUrl = '';
					if (urlElement && urlElement instanceof WebElement) {
						profileUrl = await urlElement.getAttribute('href');
						// If URL contains a "?" parameter, remove it
						profileUrl = profileUrl.split('?')[0];
					}

					if (!profileUrl) {
						logger.warn(`No profile URL found for card ${i + 1}`);
						continue;
					}

					// Extract name using SelectorVerifier
					const nameElement = await this.selectorVerifier.findElementWithinContext(
						card,
						'Search Result Name',
						false
					);

					let name = '';
					if (nameElement && nameElement instanceof WebElement) {
						name = await nameElement.getText();
					}

					if (!name) {
						try {
							// Try getting text from the link directly as fallback
							const links = await card.findElements(By.xpath(".//a[contains(@href, '/in/')]"));
							if (links.length > 0) {
								name = await links[0].getText();
							}
						} catch (e) {
							// Ignore errors in fallback
						}
					}

					// Extract headline using SelectorVerifier
					const headlineElement = await this.selectorVerifier.findElementWithinContext(
						card,
						'Search Result Headline',
						false
					);

					let headline = '';
					if (headlineElement && headlineElement instanceof WebElement) {
						headline = await headlineElement.getText();
					}

					// Extract location using SelectorVerifier
					const locationElement = await this.selectorVerifier.findElementWithinContext(
						card,
						'Search Result Location',
						false
					);

					let location = '';
					if (locationElement && locationElement instanceof WebElement) {
						location = await locationElement.getText();
					}

					// Try to extract connection degree
					let connectionDegree = '';
					try {
						// Common location for connection degree info
						const degreeElement = await card.findElement(By.xpath(".//span[contains(text(), '1st') or contains(text(), '2nd') or contains(text(), '3rd')]"));
						connectionDegree = await degreeElement.getText();
					} catch (e) {
						// Ignore errors
					}

					// Add to profiles array if we at least have a URL
					if (profileUrl) {
						profiles.push({
							profileUrl,
							name: name || 'Unknown',
							headline: headline || '',
							location: location || '',
							connectionDegree: connectionDegree || '',
							metadataId: this.generateMetadataId(profileUrl)
						});

						// Log the found profile
						logger.info(`Found profile: ${name || 'Unknown'} - ${profileUrl}`);

						if (profiles.length >= maxResults) {
							break;
						}
					}
				} catch (cardError) {
					logger.warn(`Error processing profile card: ${cardError instanceof Error ? cardError.message : String(cardError)}`);
				}
			}

			// If we have enough profiles or we're on the last page, break
			if (profiles.length >= maxResults) {
				break;
			}

			// Take a screenshot before looking for pagination
			await this.takeScreenshot(driver, `before-pagination-${currentPage}`, true, 'debug-screenshots');

			// Try to navigate to the next page
			try {
				// Try to find the "Next" button using selector verifier
				const nextButton = await this.selectorVerifier.findElementByCategory(
					driver,
					'Search Pagination',
					false,
					true
				) as WebElement;

				if (nextButton) {
					logger.info(`Found next button after scrolling with selector: button[aria-label="Next"]`);
					const isEnabled = await nextButton.isEnabled();
					if (isEnabled) {
						await nextButton.click();
						logger.info(`Clicked next page button`);
						await driver.sleep(5000);

						// Take another screenshot after pagination
						await this.takeScreenshot(driver, `after-pagination-${currentPage}`, true, 'debug-screenshots');

						// Verify we actually navigated to a new page by finding the results container again
						const resultsContainer = await this.selectorVerifier.findElementByCategory(
							driver,
							'Search Container',
							false,
							false
						);

						if (resultsContainer) {
							logger.info(`Found results container after pagination with selector: .search-results-container`);
							// Successfully navigated to the next page
							currentPage++;
						} else {
							logger.warn('Failed to find results container after pagination. May have reached the end of results.');
							break;
						}
					} else {
						logger.info('Next button is disabled, reached last page of search results');
						break;
					}
				} else {
					logger.info('Next button not found, reached last page of search results');
					break;
				}
			} catch (nextError) {
				logger.warn(`Error navigating to next page: ${nextError instanceof Error ? nextError.message : String(nextError)}`);
				break;
			}
		}

		logger.info(`Total profiles: ${JSON.stringify(profiles.map(p => p.profileUrl))} || Campaign ID: N/A`);
		return profiles;
	}

	/**
	 * Run verification on all selectors
	 * Useful for testing selectors against real LinkedIn profiles
	 * @param profileUrl LinkedIn profile URL to test against
	 * @param linkedInAccount Optional LinkedIn account for authentication
	 * @param password Optional password for the LinkedIn account
	 */
	public static async verifySelectors(profileUrl: string, linkedInAccount?: ILinkedInAccount, password?: string): Promise<Map<string, SelectorHealthMetrics>> {
		const instance = LinkedInProfileScraper.getInstance();

		// Reset health metrics before running tests
		instance.selectorVerifier.resetHealthMetrics();

		logger.info(`Starting LinkedIn selector verification for profile: ${profileUrl}`);
		logger.info(`Using LinkedIn account: ${linkedInAccount?.username || 'None provided'}`);

		let driver: WebDriver | null = null;
		let driverCreated = false;

		try {
			// Set up a new web driver with extended timeouts for verification
			driver = await instance.setupDriver(linkedInAccount);
			driverCreated = true;

			try {
				// Navigate to the profile
				logger.info(`Navigating to LinkedIn profile: ${profileUrl}`);
				await instance.navigateToProfile(driver, profileUrl, linkedInAccount, password);
				logger.info('Profile navigation completed');

				// Take screenshot of the loaded profile page
				await instance.takeScreenshot(driver, 'profile-page-loaded');

				// Scroll through profile to load all dynamic content
				logger.info('Scrolling through profile to load all dynamic content');
				await instance.scrollToBottom(driver);
				logger.info('Profile scrolling completed');

				// Test all selectors by calling the various extract methods
				logger.info('Testing selectors by extracting profile data');

				// Extract some key profile elements to verify selectors
				try {
					await instance.extractName(driver);
					await instance.extractHeadline(driver);
					await instance.extractLocation(driver);
					await instance.extractAbout(driver);
					await instance.extractExperience(driver);
					await instance.extractEducation(driver);
					await instance.extractSkills(driver);
					await instance.extractContactInfo(driver);
				} catch (error) {
					logger.warn(`Error during selector testing: ${error instanceof Error ? error.message : String(error)}`);
				}

				logger.info('Selector testing completed');

				// Return health metrics
				const metrics = instance.selectorVerifier.getHealthMetrics();
				logger.info(`Verified ${metrics.size} selectors successfully`);

				return metrics;
			} catch (navigationError) {
				logger.error(`Error navigating to profile: ${navigationError instanceof Error ? navigationError.message : String(navigationError)}`);

				// Try to take a screenshot of the failed state
				if (driver) {
					try {
						await instance.takeScreenshot(driver, 'profile-navigation-failed');

						// Log current URL for diagnostics
						const currentUrl = await driver.getCurrentUrl();
						logger.info(`Current URL at failure: ${currentUrl}`);

						// Log page title for diagnostics
						const pageTitle = await driver.getTitle();
						logger.info(`Page title at failure: ${pageTitle}`);
					} catch (screenshotError) {
						logger.warn(`Could not take error screenshot: ${screenshotError instanceof Error ? screenshotError.message : String(screenshotError)}`);
					}
				}

				throw navigationError;
			}
		} catch (error) {
			logger.error(`Error verifying selectors: ${error instanceof Error ? error.message : String(error)}`);
			throw error;
		} finally {
			// Only close driver if we created it in this method
			if (driver && driverCreated) {
				try {
					logger.info('Closing WebDriver');
					await driver.quit();
					logger.info('WebDriver closed successfully');
				} catch (quitError) {
					logger.warn(`Error closing driver: ${quitError instanceof Error ? quitError.message : String(quitError)}`);
				}
			} else if (driver) {
				logger.info('Not closing WebDriver as it was reused from WebDriverManager');
			}
		}
	}

	/**
	 * Non-static version of verifySelectors that forwards to the static method
	 * This allows the instance to call the static method directly
	 * @param profileUrl LinkedIn profile URL to test against
	 * @param linkedInAccount Optional LinkedIn account for authentication
	 * @param password Optional password for the LinkedIn account
	 */
	public async verifySelectors(profileUrl: string, linkedInAccount?: ILinkedInAccount, password?: string): Promise<Map<string, SelectorHealthMetrics>> {
		return LinkedInProfileScraper.verifySelectors(profileUrl, linkedInAccount, password);
	}

	/**
	 * Get selector health metrics
	 * @returns Map of selector health metrics
	 */
	public getSelectorHealthMetrics(): Map<string, SelectorHealthMetrics> {
		return this.selectorVerifier.getHealthMetrics();
	}

	/**
	 * Reset selector health metrics
	 */
	public resetSelectorHealthMetrics(): void {
		this.selectorVerifier.resetHealthMetrics();
	}

	private async waitForProfileLoad(driver: WebDriver): Promise<void> {
		try {
			// Wait for critical profile elements with extended timeout
			const waitTimeMs = 15000; // 15 seconds

			// Take an initial screenshot when entering the waitForProfileLoad method
			try {
				await this.takeScreenshot(driver, 'profile-wait-begin');
			} catch (screenshotError) {
				logger.warn(`Error taking initial load screenshot: ${screenshotError instanceof Error ? screenshotError.message : String(screenshotError)}`);
			}

			// Wait for profile elements to load with safety timeout
			try {
				const waitCondition = new Promise<boolean>(async (resolve, reject) => {
					const startTime = Date.now();
					let sessionValid = true;

					const checkProfileLoaded = async () => {
						try {
							// First check if driver session is still valid
							try {
								// Simple test to see if driver is responsive
								await driver.getTitle();
							} catch (sessionError) {
								if (sessionValid) { // Only log this once
									logger.error(`Driver session invalid during load check: ${sessionError instanceof Error ? sessionError.message : String(sessionError)}`);
									sessionValid = false;
								}

								// Don't reject immediately, try to recover if possible
								// For example, we could be on a redirect that will ultimately resolve
								const elapsedTime = Date.now() - startTime;
								if (elapsedTime >= waitTimeMs) {
									// If we've tried long enough, give up
									reject(new Error('Driver session became invalid and could not recover'));
									return;
								}

								// Try again after a short delay
								setTimeout(checkProfileLoaded, 1000);
								return;
							}

							// Session is valid, check multiple indicators that the profile has loaded
							const currentUrl = await driver.getCurrentUrl();

							// Check for key profile elements
							const namePresent = await this.isElementPresent(driver, 'h1.text-heading-xlarge');

							// Check for LinkedIn profile URL patterns
							const profileUrlPatterns = [
								/linkedin\.com\/in\//,
								/linkedin\.com\/pub\//,
								/linkedin\.com\/profile\//
							];

							const isProfileUrl = profileUrlPatterns.some(pattern => pattern.test(currentUrl));

							if (!isProfileUrl) {
								logger.warn(`Current URL does not match a LinkedIn profile pattern: ${currentUrl}`);
								// Continue checking if we're within the timeout period
								const elapsedTime = Date.now() - startTime;
								if (elapsedTime >= waitTimeMs) {
									logger.error(`Timeout reached and URL still doesn't match profile pattern: ${currentUrl}`);
									resolve(false); // Continue with best effort rather than failing
								} else {
									setTimeout(checkProfileLoaded, 1000);
									return;
								}
							}

							// Simple scroll to help load content (without excessive scrolling)
							try {
								// Get current scroll height
								const scrollHeight = await driver.executeScript('return document.body.scrollHeight') as number;
								// Scroll down 30% of the page
								await driver.executeScript(`window.scrollTo(0, ${Math.floor(scrollHeight * 0.3)})`);
								await driver.sleep(800);
								// Scroll to top
								await driver.executeScript('window.scrollTo(0, 0)');
							} catch (scrollError) {
								// Non-fatal, just log it
								logger.warn(`Error during scroll check: ${scrollError instanceof Error ? scrollError.message : String(scrollError)}`);
							}

							// Check if more sections have loaded
							const sectionsLoaded = await this.areProfileSectionsLoaded(driver);

							// LinkedIn profile loaded indicators
							const isLoaded = namePresent && sectionsLoaded &&
								(isProfileUrl);

							if (isLoaded) {
								// Profile has loaded successfully
								logger.info('LinkedIn profile loaded successfully');
								resolve(true);
								return;
							}

							// Profile not yet loaded, check if we should keep waiting
							const elapsedTime = Date.now() - startTime;
							if (elapsedTime >= waitTimeMs) {
								// Timeout, resolve with whatever we have
								logger.warn(`Profile load timeout (${elapsedTime}ms). Proceeding with partial content.`);
								try {
									await this.takeScreenshot(driver, 'profile-load-timeout');
								} catch (screenshotError) {
									logger.warn(`Error taking timeout screenshot: ${screenshotError instanceof Error ? screenshotError.message : String(screenshotError)}`);
								}
								resolve(false);
								return;
							}

							// Try again after a short delay
							setTimeout(checkProfileLoaded, 1000);
						} catch (error) {
							// Handle errors in the check function
							logger.error(`Error checking if profile loaded: ${error instanceof Error ? error.message : String(error)}`);

							// If it's a fatal error, reject
							if (error instanceof Error && (
								error.message.includes('invalid session') ||
								error.message.includes('no such session') ||
								error.message.includes('not connected'))) {
								reject(error);
							} else {
								// For non-fatal errors, continue checking if we're within timeout
								const elapsedTime = Date.now() - startTime;
								if (elapsedTime >= waitTimeMs) {
									// We've tried long enough, resolve with failure but don't throw
									resolve(false);
								} else {
									setTimeout(checkProfileLoaded, 1000);
								}
							}
						}
					};

					// Start checking
					checkProfileLoaded();
				});

				// Wait for the profile to load with a timeout
				await Promise.race([
					waitCondition,
					new Promise((_, reject) => setTimeout(() => reject(new Error('Absolute profile load timeout')), waitTimeMs + 5000))
				]);

				// Take a screenshot after waiting for the profile to load
				try {
					await this.takeScreenshot(driver, 'after-profile-load');
				} catch (screenshotError) {
					logger.warn(`Error taking after-load screenshot: ${screenshotError instanceof Error ? screenshotError.message : String(screenshotError)}`);
				}

			} catch (waitError) {
				// If waiting fails, log and continue with best effort
				logger.error(`Error during profile load wait: ${waitError instanceof Error ? waitError.message : String(waitError)}`);

				// Check if driver is still valid
				let driverValid = false;
				try {
					await driver.getTitle();
					driverValid = true;
				} catch (sessionError) {
					logger.error(`Driver session invalid after wait error: ${sessionError instanceof Error ? sessionError.message : String(sessionError)}`);
					// Continue with best effort
				}

				// Still try to take a screenshot if driver is valid
				if (driverValid) {
					try {
						await this.takeScreenshot(driver, 'profile-wait-error');
					} catch (screenshotError) {
						// Just log, don't throw
						logger.warn(`Error taking error screenshot: ${screenshotError instanceof Error ? screenshotError.message : String(screenshotError)}`);
					}
				}
			}

			// Additional safety wait to ensure dynamic content is loaded, regardless of wait success
			try {
				await driver.sleep(3000);
			} catch (sleepError) {
				logger.warn(`Error during final sleep: ${sleepError instanceof Error ? sleepError.message : String(sleepError)}`);
			}

		} catch (error) {
			logger.error(`Error waiting for profile to load: ${error instanceof Error ? error.message : String(error)}`);
			// Try to take an error screenshot, but don't throw if it fails
			try {
				await this.takeScreenshot(driver, 'profile-load-error');
			} catch (screenshotError) {
				logger.warn(`Error taking error screenshot: ${screenshotError instanceof Error ? screenshotError.message : String(screenshotError)}`);
			}
			// Re-throw the original error
			throw error;
		}
	}

	/**
	 * Check if key profile sections are loaded
	 */
	private async areProfileSectionsLoaded(driver: WebDriver): Promise<boolean> {
		try {
			// Check for common section headers or containers that would indicate profile sections have loaded
			const sectionSelectors = [
				// About section
				'section#about',
				'div[data-view-name="profile-about"]',
				// Experience section
				'section#experience',
				'div[data-view-name="profile-positions"]',
				// Education section
				'section#education',
				'div[data-view-name="profile-education"]',
				// Skills section
				'section#skills',
				'div[data-view-name="profile-skills"]'
			];

			// Count how many sections are found
			let sectionsFound = 0;
			for (const selector of sectionSelectors) {
				try {
					const elements = await driver.findElements(By.css(selector));
					if (elements.length > 0) {
						sectionsFound++;
					}
				} catch (selectorError) {
					// Ignore individual selector errors
				}
			}

			// Consider the profile loaded if we found at least 2 sections
			// This handles profiles that might not have all sections
			return sectionsFound >= 2;
		} catch (error) {
			logger.warn(`Error checking profile sections: ${error instanceof Error ? error.message : String(error)}`);
			return false;
		}
	}

	/**
	 * Check if an element is present on the page
	 */
	private async isElementPresent(driver: WebDriver, selector: string): Promise<boolean> {
		try {
			const elements = await driver.findElements(By.css(selector));
			return elements.length > 0;
		} catch (error) {
			return false;
		}
	}

	/**
	 * Extract profile name
	 * @param driver WebDriver instance
	 * @returns First and last name
	 */
	private async extractName(driver: WebDriver): Promise<{ firstName?: string; lastName?: string }> {
		try {
			// Use the centralized XPath selectors via the getTextByCategory helper
			const fullName = await this.getTextByCategory(driver, "Profile Name");

			if (fullName) {
				logger.info(`Successfully extracted name: ${fullName}`);
				const nameParts = fullName.split(/\s+/);
				return {
					firstName: nameParts[0],
					lastName: nameParts.length > 1 ? nameParts.slice(1).join(' ') : undefined
				};
			}

			// Fallback to direct XPath approach if the selector verifier didn't work
			const xpathSelectors = getXPathSelectors("Profile Name");

			for (const xpath of xpathSelectors) {
				try {
					const elements = await driver.findElements(By.xpath(xpath));
					for (const element of elements) {
						if (await element.isDisplayed()) {
							const fullName = await element.getText();
							if (fullName && fullName.trim()) {
								logger.info(`Successfully extracted name using XPath: ${xpath}`);
								const nameParts = fullName.trim().split(/\s+/);
								return {
									firstName: nameParts[0],
									lastName: nameParts.length > 1 ? nameParts.slice(1).join(' ') : undefined
								};
							}
						}
					}
				} catch (error) {
					continue;
				}
			}

			return { firstName: undefined, lastName: undefined };
		} catch (error) {
			logger.warn(`Error extracting name: ${error instanceof Error ? error.message : String(error)}`);
			return { firstName: undefined, lastName: undefined };
		}
	}

	/**
	 * Extract profile headline
	 * @param driver WebDriver instance
	 * @returns Profile headline
	 */
	private async extractHeadline(driver: WebDriver): Promise<string | undefined> {
		try {
			const headlineSelectors = [
				// 2024 Updated LinkedIn Headline Selectors
				'div.display-flex.justify-space-between div.ph5 div.text-body-medium.break-words',
				'div.pv-profile div.text-body-medium.break-words',
				'div.mt2.relative div.text-body-medium.break-words',
				'div.profile-info-card div.text-body-medium',
				'div[data-member-id] div.text-body-medium',
				'div.core-section-container__content div.text-body-medium',
				'div.profile-top-card div.text-body-medium',
				// Keep some original selectors as fallbacks
				'div.pv-text-details__left-panel div.text-body-medium',
				'div.ph5 div.text-body-medium',
				'div.ph5 div.mt2 div.text-body-medium',
				'div.artdeco-entity-lockup__subtitle'
			];

			for (const selector of headlineSelectors) {
				try {
					const elements = await driver.findElements(By.css(selector));
					for (const element of elements) {
						if (await element.isDisplayed()) {
							const headline = await element.getText();
							if (headline && headline.trim()) {
								return headline.trim();
							}
						}
					}
				} catch (error) {
					continue;
				}
			}

			return undefined;
		} catch (error) {
			logger.error('Error extracting headline:', error);
			return undefined;
		}
	}

	/**
	 * Extract profile location
	 * @param driver WebDriver instance
	 * @returns Profile location
	 */
	private async extractLocation(driver: WebDriver): Promise<string | undefined> {
		try {
			const locationSelectors = [
				// 2024 Updated LinkedIn Location Selectors
				'div.display-flex.justify-space-between div.ph5 span.text-body-small.inline',
				'div.pv-profile span.text-body-small.inline.t-black--light',
				'div.profile-top-card span.text-body-small.inline',
				'div.mt2.relative span.text-body-small',
				'div[data-member-id] span.text-body-small.inline',
				'div.profile-info-card span.text-body-small.inline',
				'div.profile-location-card span.text-body-small',
				// Keep some original selectors as fallbacks
				'div.pv-text-details__left-panel span.text-body-small.inline.t-black--light.break-words',
				'div.ph5 span.text-body-small.inline.t-black--light.break-words',
				'div.ph5 div.mt2 span.text-body-small',
				'div.artdeco-entity-lockup__caption'
			];

			for (const selector of locationSelectors) {
				try {
					const elements = await driver.findElements(By.css(selector));
					for (const element of elements) {
						if (await element.isDisplayed()) {
							const text = await element.getText();
							if (text && text.trim()) {
								logger.info(`Successfully extracted location using selector: ${selector}`);
								return text.trim();
							}
						}
					}
				} catch (error) {
					continue;
				}
			}

			// Try XPath as fallback
			const xpathSelectors = [
				"//div[contains(@class, 'pv-text-details__left-panel')]//span[contains(@class, 'text-body-small') and contains(@class, 't-black--light')]",
				"//div[contains(@class, 'ph5')]//span[contains(@class, 'text-body-small') and contains(@class, 't-black--light')]",
				"//div[contains(@class, 'profile-info')]//span[contains(@class, 'text-body-small')]"
			];

			for (const xpath of xpathSelectors) {
				try {
					const elements = await driver.findElements(By.xpath(xpath));
					for (const element of elements) {
						if (await element.isDisplayed()) {
							const text = await element.getText();
							if (text && text.trim()) {
								logger.info(`Successfully extracted location using XPath: ${xpath}`);
								return text.trim();
							}
						}
					}
				} catch (error) {
					continue;
				}
			}

			return undefined;
		} catch (error) {
			logger.warn(`Error extracting location: ${error instanceof Error ? error.message : String(error)}`);
			return undefined;
		}
	}

	/**
	 * Extract profile about section
	 * @param driver WebDriver instance
	 * @returns Profile about section
	 */
	private async extractAbout(driver: WebDriver): Promise<string | undefined> {
		try {
			// First try to find the About section container
			const aboutSectionSelectors = [
				// 2024 Updated LinkedIn About Section Selectors
				'section.artdeco-card.pv-profile-section.pv-about-section',
				'section[data-view-name="profile-about"]',
				'section#about',
				'div.display-flex.ph5.pv3',
				'div.pv-shared-text-with-see-more',
				'div[data-field="summary"]',
				'div.core-section-container__content section[id="about"]',
				// Keep original selectors as fallbacks
				'section#about',
				'section[data-section="about"]',
				'section.artdeco-card.pv-profile-card.break-words',
				'div#about',
				'div[data-field="about"]',
				'div.pvs-list__outer-container'
			];

			// Try to expand all "See more" buttons in the about section
			await this.clickExpandButtons(driver, aboutSectionSelectors);
			await randomDelay(1000, 2000); // Wait for content to load

			const aboutTextSelectors = [
				// 2024 Updated LinkedIn About Text Selectors
				'div.display-flex.ph5.pv3 div.inline-show-more-text span[aria-hidden="true"]',
				'div.pv-shared-text-with-see-more span[aria-hidden="true"]',
				'div.pvs-list__outer-container div.inline-show-more-text span[aria-hidden="true"]',
				'div.display-flex.flex-row.align-items-center div.inline-show-more-text span[aria-hidden="true"]',
				'div.profile-about-text div.t-14 span[aria-hidden="true"]',
				// Keep original selectors as fallbacks
				'div.inline-show-more-text span[aria-hidden="true"]',
				'div.pv-shared-text-with-see-more span[aria-hidden="true"]',
				'div.pv-about__summary-text span[aria-hidden="true"]',
				'div.pvs-description span[aria-hidden="true"]',
				'div.pv-entity__description span[aria-hidden="true"]',
				'div.pvs-entity__title-text span[aria-hidden="true"]'
			];

			for (const sectionSelector of aboutSectionSelectors) {
				try {
					const section = await driver.findElement(By.css(sectionSelector));
					if (await section.isDisplayed()) {
						const aboutText = await this.extractTextFromElements(await section.findElements(By.css(aboutTextSelectors.join(','))));
						if (aboutText) {
							return aboutText;
						}
					}
				} catch (error) {
					continue;
				}
			}

			// If section-based approach fails, try to find the text directly
			try {
				const aboutText = await this.extractTextFromElements(await driver.findElements(By.css(aboutTextSelectors.join(','))));
				if (aboutText) {
					return aboutText;
				}
			} catch (error) {
				logger.debug(`Error in fallback about text extraction: ${error instanceof Error ? error.message : String(error)}`);
			}

			return undefined;
		} catch (error) {
			logger.error('Error extracting about section:', error);
			return undefined;
		}
	}

	private async extractBackgroundImage(driver: WebDriver): Promise<string | undefined> {
		try {
			const backgroundElement = await driver.findElement(By.css('.profile-background-image__image'));
			return await backgroundElement.getAttribute('src');
		} catch (error) {
			return undefined;
		}
	}

	/**
	 * Extract connections count
	 * @param driver WebDriver instance
	 * @returns Connection count or undefined
	 */
	private async extractConnections(driver: WebDriver): Promise<number | undefined> {
		try {
			logger.info('Extracting connections data');

			// Try to find the connections section
			const connectionsElement = await this.selectorVerifier.findElementByCategory(
				driver,
				'Connections',
				false,
				true // Take a screenshot for debugging
			) as WebElement;

			if (!connectionsElement) {
				logger.info('No connections element found');
				return undefined;
			}

			// Extract the text
			const connectionsText = await connectionsElement.getText();

			// Extract numbers from the text
			const matches = connectionsText.match(/(\d+)/);
			if (matches && matches[1]) {
				const count = parseInt(matches[1], 10);
				logger.info(`Found ${count} connections`);
				return count;
			}

			return undefined;
		} catch (error) {
			logger.warn(`Error in extractConnections: ${error instanceof Error ? error.message : String(error)}`);
			return undefined;
		}
	}

	private async extractFollowers(driver: WebDriver): Promise<number | undefined> {
		try {
			const selectors = [
				'div.top-card__followers-count',
				'div.pv-top-card--list span.t-bold',
				'div.pv-recent-activity-section__follower-count',
				'span[data-test-id="follower-count"]'
			];

			for (const selector of selectors) {
				try {
					const element = await driver.findElement(By.css(selector));
					if (await element.isDisplayed()) {
						const text = await element.getText();
						const match = text.match(/(\d+,?\d*)\+?\s*followers?/i);
						if (match) {
							return parseInt(match[1].replace(/,/g, ''), 10);
						}
					}
				} catch (error) {
					continue;
				}
			}
			return undefined;
		} catch (error) {
			logger.warn(`Error extracting followers: ${error instanceof Error ? error.message : String(error)}`);
			return undefined;
		}
	}

	private async extractEndorsements(driver: WebDriver): Promise<Endorsement[]> {
		try {
			const endorsements: Endorsement[] = [];
			const skillsSection = await driver.findElement(By.css('section.pv-skill-categories-section'));

			// Expand the skills section if possible
			try {
				const showMoreButton = await skillsSection.findElement(By.css('button.pv-skills-section__additional-skills'));
				await showMoreButton.click();
				await driver.sleep(1000); // Wait for expansion animation
			} catch (error) {
				// No show more button or already expanded
			}

			const skillElements = await skillsSection.findElements(By.css('div.pv-skill-category-entity'));

			for (const skillElement of skillElements) {
				try {
					const skillName = await skillElement.findElement(By.css('.pv-skill-category-entity__name')).getText();
					const endorserCountElement = await skillElement.findElement(By.css('.pv-skill-category-entity__endorsement-count'));
					const endorserCount = parseInt(await endorserCountElement.getText(), 10) || 0;

					const endorserProfiles: { name: string; headline?: string; profileUrl?: string; }[] = [];

					// Try to get endorser profiles if available
					try {
						const endorserElements = await skillElement.findElements(By.css('.pv-skill-category-entity__endorser-profile'));
						for (const endorserElement of endorserElements) {
							const endorserName = await endorserElement.findElement(By.css('.pv-skill-category-entity__endorser-name')).getText();
							let headline: string | undefined;
							let profileUrl: string | undefined;

							try {
								headline = await endorserElement.findElement(By.css('.pv-skill-category-entity__endorser-headline')).getText();
							} catch (error) {
								// Headline not available
							}

							try {
								const profileLink = await endorserElement.findElement(By.css('a'));
								profileUrl = await profileLink.getAttribute('href');
							} catch (error) {
								// Profile URL not available
							}

							endorserProfiles.push({ name: endorserName, headline, profileUrl });
						}
					} catch (error) {
						// Endorser profiles not available
					}

					endorsements.push({
						skill: skillName,
						endorsers: endorserCount,
						endorserProfiles: endorserProfiles.length > 0 ? endorserProfiles : undefined
					});
				} catch (error) {
					logger.warn(`Error extracting endorsement details: ${error instanceof Error ? error.message : String(error)}`);
					continue;
				}
			}

			return endorsements;
		} catch (error) {
			logger.error('Error extracting endorsements:', error);
			return [];
		}
	}

	private async extractCertifications(driver: WebDriver): Promise<NonNullable<LinkedInProfileData['certifications']>> {
		try {
			const certifications: NonNullable<LinkedInProfileData['certifications']> = [];
			const sectionSelectors = [
				'section#certifications',
				'section.certifications-section',
				'div[id*="certifications"]'
			];

			for (const sectionSelector of sectionSelectors) {
				try {
					const section = await driver.findElement(By.css(sectionSelector));
					if (await section.isDisplayed()) {
						const items = await section.findElements(By.css('.pvs-list__item-container, .pv-certification-entity'));

						for (const item of items) {
							try {
								const nameElement = await item.findElement(By.css('.pvs-entity__title-text, .pv-entity__title'));
								const orgElement = await item.findElement(By.css('.pvs-entity__subtitle-text, .pv-entity__secondary-title'));

								const nameText = await nameElement.getText() || '';
								const orgText = await orgElement.getText() || '';

								if (!nameText || !orgText) continue;

								const certification = {
									name: nameText,
									issuingOrganization: orgText,
									issueDate: '',
									expirationDate: '',
									credentialId: '',
									credentialUrl: ''
								};

								try {
									const dateElement = await item.findElement(By.css('.pvs-entity__date-range, .pv-entity__date-range'));
									const dateText = await dateElement.getText() || '';
									if (dateText) {
										const dates = dateText.split(' - ').map(d => d.trim()).filter(Boolean);
										if (dates[0]) certification.issueDate = dates[0];
										if (dates[1]) certification.expirationDate = dates[1];
									}
								} catch (error) {
									// Dates are optional
								}

								try {
									const credentialElement = await item.findElement(By.css('.pv-certifications__credential-id'));
									const credentialId = await credentialElement.getText() || '';
									if (credentialId) certification.credentialId = credentialId;
								} catch (error) {
									// Credential ID is optional
								}

								try {
									const urlElement = await item.findElement(By.css('a[data-test-certification-url]'));
									const credentialUrl = await urlElement.getAttribute('href') || '';
									if (credentialUrl) certification.credentialUrl = credentialUrl;
								} catch (error) {
									// URL is optional
								}

								certifications.push(certification);
							} catch (error) {
								continue;
							}
						}

						if (certifications.length > 0) break;
					}
				} catch (error) {
					continue;
				}
			}

			return certifications;
		} catch (error) {
			logger.warn(`Error extracting certifications: ${error instanceof Error ? error.message : String(error)}`);
			return [];
		}
	}

	private async extractSkills(driver: WebDriver): Promise<string[]> {
		try {
			const skills: string[] = [];

			// First try to find the Skills section container
			const skillsSectionSelectors = [
				// 2024 Updated LinkedIn Skills Section Selectors
				'section.artdeco-card.pv-profile-section.pv-skill-categories-section',
				'section[data-view-name="skills-section"]',
				'section#skills',
				'div.display-flex.flex-column.full-width div[aria-label*="skill"]',
				'div.pvs-list[aria-label*="skill"]',
				'div.core-section-container__content section[id="skills"]',
				// Keep original selectors as fallbacks
				'section#skills',
				'section[data-section="skills"]',
				'section.artdeco-card.pv-profile-card.break-words',
				'div#skills',
				'div[data-field="skills"]',
				'div.pvs-list__outer-container'
			];

			// Try to expand all "See more" buttons in the skills section
			await this.clickExpandButtons(driver, skillsSectionSelectors);
			await randomDelay(1000, 2000); // Wait for content to load

			// Try different selectors for skill items
			const skillItemSelectors = [
				// 2024 Updated LinkedIn Skill Item Selectors
				'div.display-flex.flex-row.align-items-center',
				'div.pvs-entity.pvs-entity--padded',
				'div.artdeco-list__item',
				'div.pv-skill-category-entity',
				'div.pvs-list__item--with-hover-container',
				'span.pv-skill-category-entity__name',
				// Keep original selectors as fallbacks
				'li.artdeco-list__item',
				'div.pvs-entity',
				'div.pv-skill-category-entity',
				'div.pv-profile-section__card-item',
				'div.pv-entity__summary-info',
				'div.skill-item'
			];

			const skillTextSelectors = [
				// 2024 Updated LinkedIn Skill Text Selectors
				'div.display-flex.flex-column.full-width span.mr1.hoverable-link-text span[aria-hidden="true"]',
				'div.pvs-entity__title-text span.t-bold span[aria-hidden="true"]',
				'span.pv-skill-category-entity__name span[aria-hidden="true"]',
				'div.pvs-entity__info-container span.t-bold span[aria-hidden="true"]',
				'div.pvs-list__paged-list-item span.t-bold span[aria-hidden="true"]',
				// Keep original selectors as fallbacks
				'span.mr1.hoverable-link-text span[aria-hidden="true"]',
				'span.t-14.t-black.t-bold span[aria-hidden="true"]',
				'span.pv-skill-category-entity__name-text',
				'div.pv-entity__skill-name',
				'div.inline-show-more-text span[aria-hidden="true"]',
				'div.pvs-entity__title-text span[aria-hidden="true"]'
			];

			for (const sectionSelector of skillsSectionSelectors) {
				try {
					const section = await driver.findElement(By.css(sectionSelector));
					if (await section.isDisplayed()) {
						const items = await section.findElements(By.css(skillItemSelectors.join(',')));
						for (const item of items) {
							try {
								if (await item.isDisplayed()) {
									const skillText = await this.extractTextFromElements(await item.findElements(By.css(skillTextSelectors.join(','))));
									if (skillText) {
										skills.push(skillText);
									}
								}
							} catch (error) {
								continue;
							}
						}
						if (skills.length > 0) {
							break; // Found skills, no need to try other section selectors
						}
					}
				} catch (error) {
					continue;
				}
			}

			return Array.from(new Set(skills)); // Remove duplicates
		} catch (error) {
			logger.error('Error extracting skills:', error);
			return [];
		}
	}

	private async extractLanguages(driver: WebDriver): Promise<{ language: string; proficiency?: string; }[]> {
		try {
			const languages: { language: string; proficiency?: string; }[] = [];
			const languagesSection = await driver.findElement(By.css('section[aria-label="Languages"]'));

			const languageElements = await languagesSection.findElements(By.css('li.languages__list-item'));

			for (const languageElement of languageElements) {
				try {
					const language = await languageElement.findElement(By.css('h3')).getText();
					const proficiency = await this.getTextContent(languageElement.findElement(By.css('.languages__proficiency')));

					languages.push({ language, proficiency });
				} catch (error) {
					// Skip this language if there's an error
					continue;
				}
			}

			return languages;
		} catch (error) {
			return [];
		}
	}

	private async extractContactInfo(driver: WebDriver): Promise<LinkedInProfileData['contactInfo']> {
		try {
			// Click the contact info button to open the modal
			const contactInfoButton = await driver.findElement(By.css('a[data-control-name="contact_see_more"]'));
			await contactInfoButton.click();
			await driver.sleep(1000); // Wait for modal to open

			const contactInfo: NonNullable<LinkedInProfileData['contactInfo']> = {};

			const modal = await driver.findElement(By.css('div.pv-profile-section__section-info'));

			// Extract email
			try {
				const emailSection = await modal.findElement(By.css('section.ci-email'));
				const email = await emailSection.findElement(By.css('a')).getText();
				if (email) contactInfo.email = email;
			} catch (error) { }

			// Extract phone
			try {
				const phoneSection = await modal.findElement(By.css('section.ci-phone'));
				const phone = await phoneSection.findElement(By.css('span')).getText();
				if (phone) contactInfo.phone = phone;
			} catch (error) { }

			// Extract websites
			try {
				const websitesSection = await modal.findElement(By.css('section.ci-websites'));
				const websiteElements = await websitesSection.findElements(By.css('a'));
				if (websiteElements.length > 0) {
					contactInfo.websites = await Promise.all(
						websiteElements.map(element => element.getAttribute('href'))
					);
				}
			} catch (error) { }

			// Extract Twitter
			try {
				const twitterSection = await modal.findElement(By.css('section.ci-twitter'));
				const twitter = await twitterSection.findElement(By.css('a')).getAttribute('href');
				if (twitter) contactInfo.twitter = twitter;
			} catch (error) { }

			// Extract birthday
			try {
				const birthdaySection = await modal.findElement(By.css('section.ci-birthday'));
				const birthday = await birthdaySection.findElement(By.css('span')).getText();
				if (birthday) contactInfo.birthday = birthday;
			} catch (error) { }

			// Extract connected date
			try {
				const connectedSection = await modal.findElement(By.css('section.ci-connected'));
				const connectedOn = await connectedSection.findElement(By.css('span')).getText();
				if (connectedOn) contactInfo.connectedOn = connectedOn;
			} catch (error) { }

			// Close the modal
			const closeButton = await driver.findElement(By.css('button[aria-label="Dismiss"]'));
			await closeButton.click();
			await driver.sleep(500); // Wait for modal to close

			return Object.keys(contactInfo).length > 0 ? contactInfo : undefined;
		} catch (error) {
			return undefined;
		}
	}

	private async extractLastUpdated(driver: WebDriver): Promise<string | undefined> {
		try {
			const selectors = [
				'.pv-last-activity',
				'.profile-last-updated',
				'[data-test-id="last-activity-timestamp"]'
			];

			for (const selector of selectors) {
				try {
					const element = await driver.findElement(By.css(selector));
					if (await element.isDisplayed()) {
						return await element.getText();
					}
				} catch (error) {
					continue;
				}
			}
			return undefined;
		} catch (error) {
			logger.warn(`Error extracting last updated time: ${error instanceof Error ? error.message : String(error)}`);
			return undefined;
		}
	}

	private async extractVolunteering(driver: WebDriver): Promise<NonNullable<LinkedInProfileData['volunteering']>> {
		try {
			const volunteering: NonNullable<LinkedInProfileData['volunteering']> = [];
			const sectionSelectors = [
				'section#volunteering',
				'section.volunteering-section',
				'div[id*="volunteering"]'
			];

			for (const sectionSelector of sectionSelectors) {
				try {
					const section = await driver.findElement(By.css(sectionSelector));
					if (await section.isDisplayed()) {
						const items = await section.findElements(By.css('.pvs-list__item-container, .pv-volunteering-entity'));

						for (const item of items) {
							try {
								const roleElement = await item.findElement(By.css('.pvs-entity__title-text, .pv-entity__role-details-title'));
								const orgElement = await item.findElement(By.css('.pvs-entity__subtitle-text, .pv-entity__secondary-title'));

								const role = await roleElement.getText() || '';
								const organization = await orgElement.getText() || '';

								if (!role || !organization) continue;

								const volunteer: NonNullable<LinkedInProfileData['volunteering']>[number] = {
									role,
									organization
								};

								try {
									const causeElement = await item.findElement(By.css('.pv-volunteer-causes'));
									const cause = await causeElement.getText() || '';
									if (cause) volunteer.cause = cause;
								} catch (error) {
									// Cause is optional
								}

								try {
									const dateElement = await item.findElement(By.css('.pvs-entity__date-range, .pv-entity__date-range'));
									const dateText = await dateElement.getText() || '';
									if (dateText) {
										const dates = dateText.split(' - ').map(d => d.trim()).filter(Boolean);
										if (dates[0]) volunteer.startDate = dates[0];
										if (dates[1]) volunteer.endDate = dates[1];
									}
								} catch (error) {
									// Dates are optional
								}

								try {
									const descElement = await item.findElement(By.css('.pvs-entity__description-text, .pv-entity__description'));
									const description = await descElement.getText() || '';
									if (description) volunteer.description = description;
								} catch (error) {
									// Description is optional
								}

								volunteering.push(volunteer);
							} catch (error) {
								continue;
							}
						}

						if (volunteering.length > 0) break;
					}
				} catch (error) {
					continue;
				}
			}

			return volunteering;
		} catch (error) {
			logger.warn(`Error extracting volunteering: ${error instanceof Error ? error.message : String(error)}`);
			return [];
		}
	}

	private async extractAwards(driver: WebDriver): Promise<NonNullable<LinkedInProfileData['awards']>> {
		try {
			const awards: NonNullable<LinkedInProfileData['awards']> = [];
			const sectionSelectors = [
				'section#honors_and_awards',
				'section.awards-section',
				'div[id*="awards"]'
			];

			for (const sectionSelector of sectionSelectors) {
				try {
					const section = await driver.findElement(By.css(sectionSelector));
					if (await section.isDisplayed()) {
						const items = await section.findElements(By.css('.pvs-list__item-container, .pv-accomplishment-entity'));

						for (const item of items) {
							try {
								const titleElement = await item.findElement(By.css('.pvs-entity__title-text, .pv-accomplishment-entity__title'));
								const title = await titleElement.getText() || '';

								if (!title) continue;

								const award: NonNullable<LinkedInProfileData['awards']>[number] = {
									title
								};

								try {
									const issuerElement = await item.findElement(By.css('.pvs-entity__subtitle-text, .pv-accomplishment-entity__issuer'));
									const issuer = await issuerElement.getText() || '';
									if (issuer) award.issuer = issuer;
								} catch (error) {
									// Issuer is optional
								}

								try {
									const dateElement = await item.findElement(By.css('.pvs-entity__caption-text, .pv-accomplishment-entity__date'));
									const issueDate = await dateElement.getText() || '';
									if (issueDate) award.issueDate = issueDate;
								} catch (error) {
									// Date is optional
								}

								try {
									const descElement = await item.findElement(By.css('.pvs-entity__description-text, .pv-accomplishment-entity__description'));
									const description = await descElement.getText() || '';
									if (description) award.description = description;
								} catch (error) {
									// Description is optional
								}

								awards.push(award);
							} catch (error) {
								continue;
							}
						}

						if (awards.length > 0) break;
					}
				} catch (error) {
					continue;
				}
			}

			return awards;
		} catch (error) {
			logger.warn(`Error extracting awards: ${error instanceof Error ? error.message : String(error)}`);
			return [];
		}
	}

	private async extractPublications(driver: WebDriver): Promise<NonNullable<LinkedInProfileData['publications']>> {
		try {
			const publications: NonNullable<LinkedInProfileData['publications']> = [];
			const sectionSelectors = [
				'section#publications',
				'section.publications-section',
				'div[id*="publications"]'
			];

			for (const sectionSelector of sectionSelectors) {
				try {
					const section = await driver.findElement(By.css(sectionSelector));
					if (await section.isDisplayed()) {
						const items = await section.findElements(By.css('.pvs-list__item-container, .pv-publication-entity'));

						for (const item of items) {
							try {
								const titleElement = await item.findElement(By.css('.pvs-entity__title-text, .pv-publication-entity__title'));
								const title = await titleElement.getText() || '';

								if (!title) continue;

								const publication: NonNullable<LinkedInProfileData['publications']>[number] = {
									title
								};

								try {
									const publisherElement = await item.findElement(By.css('.pvs-entity__subtitle-text, .pv-publication-entity__publisher'));
									const publisher = await publisherElement.getText() || '';
									if (publisher) publication.publisher = publisher;
								} catch (error) {
									// Publisher is optional
								}

								try {
									const dateElement = await item.findElement(By.css('.pvs-entity__caption-text, .pv-publication-entity__date'));
									const date = await dateElement.getText() || '';
									if (date) publication.date = date;
								} catch (error) {
									// Date is optional
								}

								try {
									const urlElement = await item.findElement(By.css('a[data-test-publication-url]'));
									const url = await urlElement.getAttribute('href') || '';
									if (url) publication.url = url;
								} catch (error) {
									// URL is optional
								}

								try {
									const descElement = await item.findElement(By.css('.pvs-entity__description-text, .pv-publication-entity__description'));
									const description = await descElement.getText() || '';
									if (description) publication.description = description;
								} catch (error) {
									// Description is optional
								}

								try {
									const authorsElement = await item.findElement(By.css('.pv-publication-entity__authors'));
									const authorsText = await authorsElement.getText() || '';
									if (authorsText) {
										const coAuthors = authorsText.split(',').map(a => a.trim()).filter(Boolean);
										if (coAuthors.length > 0) publication.coAuthors = coAuthors;
									}
								} catch (error) {
									// Co-authors are optional
								}

								publications.push(publication);
							} catch (error) {
								continue;
							}
						}

						if (publications.length > 0) break;
					}
				} catch (error) {
					continue;
				}
			}

			return publications;
		} catch (error) {
			logger.warn(`Error extracting publications: ${error instanceof Error ? error.message : String(error)}`);
			return [];
		}
	}

	private async extractRecommendations(driver: WebDriver): Promise<NonNullable<LinkedInProfileData['recommendations']>> {
		try {
			const recommendations: NonNullable<LinkedInProfileData['recommendations']> = [];

			// Comprehensive section selectors
			const sectionSelectors = [
				'section#recommendations',
				'section.recommendations-section',
				'div[id*="recommendations"]',
				'section.artdeco-card.pv-profile-card.break-words.mt4',
				'div.pvs-list__outer-container[aria-label*="recommendation"]'
			];

			// Try to expand all "See more" buttons in the recommendations section
			await this.clickExpandButtons(driver, sectionSelectors);
			await randomDelay(1000, 2000); // Wait for content to load

			for (const sectionSelector of sectionSelectors) {
				try {
					const section = await driver.findElement(By.css(sectionSelector));
					if (await section.isDisplayed()) {
						// Try to find the tab panel container
						const tabPanels = await section.findElements(By.css('.artdeco-tabpanel'));

						if (tabPanels.length > 0) {
							// Handle tabbed recommendations (newer layout)
							for (const panel of tabPanels) {
								try {
									const ariaLabel = await panel.getAttribute('aria-label');
									const type = ariaLabel?.toLowerCase().includes('received') ? 'received' : 'given';

									const items = await panel.findElements(By.css([
										'.pvs-list__item-container',
										'.pv-recommendation-entity',
										'.artdeco-list__item'
									].join(',')));

									for (const item of items) {
										try {
											const recommendation = await this.extractRecommendationItem(item, type);
											if (recommendation) recommendations.push(recommendation);
										} catch (error) {
											logger.debug(`Error extracting recommendation item: ${error instanceof Error ? error.message : String(error)}`);
											continue;
										}
									}
								} catch (error) {
									logger.debug(`Error processing recommendation panel: ${error instanceof Error ? error.message : String(error)}`);
									continue;
								}
							}
						} else {
							// Handle non-tabbed recommendations (older layout)
							const items = await section.findElements(By.css([
								'.pvs-list__item-container',
								'.pv-recommendation-entity',
								'.artdeco-list__item'
							].join(',')));

							for (const item of items) {
								try {
									// Try to determine type from the item's structure
									const type = await this.determineRecommendationType(item);
									const recommendation = await this.extractRecommendationItem(item, type);
									if (recommendation) recommendations.push(recommendation);
								} catch (error) {
									logger.debug(`Error extracting recommendation item: ${error instanceof Error ? error.message : String(error)}`);
									continue;
								}
							}
						}

						if (recommendations.length > 0) {
							logger.info(`Successfully extracted ${recommendations.length} recommendations`);
							break; // Found recommendations, no need to try other section selectors
						}
					}
				} catch (error) {
					logger.debug(`Error processing recommendations section with selector ${sectionSelector}: ${error instanceof Error ? error.message : String(error)}`);
					continue;
				}
			}

			return recommendations;
		} catch (error) {
			logger.warn(`Error extracting recommendations: ${error instanceof Error ? error.message : String(error)}`);
			return [];
		}
	}

	private async determineRecommendationType(item: WebElement): Promise<'received' | 'given'> {
		try {
			const selectors = [
				'.pvs-entity__text',
				'.pv-recommendation-entity__text',
				'.artdeco-list__item-title'
			];

			for (const selector of selectors) {
				try {
					const element = await item.findElement(By.css(selector));
					const text = await element.getText();
					return text.toLowerCase().includes('received') ? 'received' : 'given';
				} catch (error) {
					continue;
				}
			}

			// Default to 'received' if we can't determine
			return 'received';
		} catch (error) {
			return 'received';
		}
	}

	private async extractRecommendationItem(item: WebElement, type: 'received' | 'given'): Promise<NonNullable<LinkedInProfileData['recommendations']>[number] | null> {
		try {
			// Define selector categories
			const categories = {
				text: 'Recommendation Text',
				author: 'Recommendation Author',
				title: 'Recommendation Title',
				relationship: 'Recommendation Relationship',
				date: 'Recommendation Date',
				featured: 'Recommendation Featured'
			};

			// Multiple selectors for recommendation text
			const textSelectors = [
				'.pvs-entity__description-text',
				'.pv-recommendation-entity__text',
				'.artdeco-list__item-description',
				'div.inline-show-more-text span[aria-hidden="true"]',
				'div[data-field="recommendation_text"]'
			];

			// Multiple selectors for author name
			const authorSelectors = [
				'.pvs-entity__title-text',
				'.pv-recommendation-entity__detail__title',
				'.artdeco-list__item-title',
				'a[data-field="recommender"]',
				'span.hoverable-link-text'
			];

			// Multiple selectors for author title
			const titleSelectors = [
				'.pvs-entity__subtitle-text',
				'.pv-recommendation-entity__detail__subtitle',
				'.artdeco-list__item-subtitle',
				'div[data-field="recommender_title"]'
			];

			// Multiple selectors for relationship
			const relationshipSelectors = [
				'.pvs-entity__caption-text',
				'.pv-recommendation-entity__detail__caption',
				'.artdeco-list__item-caption',
				'div[data-field="recommender_relationship"]'
			];

			// Multiple selectors for date
			const dateSelectors = [
				'.pvs-entity__supplementary-text',
				'.pv-recommendation-entity__detail__date',
				'.artdeco-list__item-supplementary',
				'div[data-field="recommendation_date"]'
			];

			// Featured indicators
			const featuredSelectors = [
				'.pv-recommendation-entity--featured',
				'[data-field="is_featured"]',
				'.featured-recommendation'
			];

			// Extract text with retry logic and track selector effectiveness
			let text = '';
			for (const selector of textSelectors) {
				try {
					const element = await item.findElement(By.css(selector));
					text = await element.getText() || '';
					if (text) {
						// Record success for this selector
						this.selectorVerifier.updateSelectorHealth(selector, categories.text, true, { text });
						break;
					} else {
						// Record failure - found element but no text
						this.selectorVerifier.updateSelectorHealth(selector, categories.text, false);
					}
				} catch (error) {
					// Record failure - selector didn't find an element
					this.selectorVerifier.updateSelectorHealth(selector, categories.text, false);
					continue;
				}
			}

			if (!text) {
				logger.debug('No recommendation text found');
				return null;
			}

			// Extract author name with retry logic
			let authorName = '';
			for (const selector of authorSelectors) {
				try {
					const element = await item.findElement(By.css(selector));
					authorName = await element.getText() || '';
					if (authorName) {
						// Record success for this selector
						this.selectorVerifier.updateSelectorHealth(selector, categories.author, true, { text: authorName });
						break;
					} else {
						// Record failure - found element but no text
						this.selectorVerifier.updateSelectorHealth(selector, categories.author, false);
					}
				} catch (error) {
					// Record failure - selector didn't find an element
					this.selectorVerifier.updateSelectorHealth(selector, categories.author, false);
					continue;
				}
			}

			if (!authorName) {
				logger.debug('No author name found');
				return null;
			}

			const recommendation: NonNullable<LinkedInProfileData['recommendations']>[number] = {
				type,
				text: text.trim(),
				author: {
					name: authorName.trim()
				}
			};

			// Extract optional author title
			for (const selector of titleSelectors) {
				try {
					const element = await item.findElement(By.css(selector));
					const title = await element.getText() || '';
					if (title) {
						recommendation.author.title = title.trim();
						this.selectorVerifier.updateSelectorHealth(selector, categories.title, true, { text: title });
						break;
					} else {
						this.selectorVerifier.updateSelectorHealth(selector, categories.title, false);
					}
				} catch (error) {
					this.selectorVerifier.updateSelectorHealth(selector, categories.title, false);
					continue;
				}
			}

			// Extract optional relationship
			for (const selector of relationshipSelectors) {
				try {
					const element = await item.findElement(By.css(selector));
					const relationship = await element.getText() || '';
					if (relationship) {
						recommendation.author.relationship = relationship.trim();
						this.selectorVerifier.updateSelectorHealth(selector, categories.relationship, true, { text: relationship });
						break;
					} else {
						this.selectorVerifier.updateSelectorHealth(selector, categories.relationship, false);
					}
				} catch (error) {
					this.selectorVerifier.updateSelectorHealth(selector, categories.relationship, false);
					continue;
				}
			}

			// Extract optional date
			for (const selector of dateSelectors) {
				try {
					const element = await item.findElement(By.css(selector));
					const date = await element.getText() || '';
					if (date) {
						recommendation.date = date.trim();
						this.selectorVerifier.updateSelectorHealth(selector, categories.date, true, { text: date });
						break;
					} else {
						this.selectorVerifier.updateSelectorHealth(selector, categories.date, false);
					}
				} catch (error) {
					this.selectorVerifier.updateSelectorHealth(selector, categories.date, false);
					continue;
				}
			}

			// Try to extract featured/highlighted status
			try {
				let isFeatured = false;
				for (const selector of featuredSelectors) {
					try {
						const element = await item.findElement(By.css(selector));
						if (await element.isDisplayed()) {
							isFeatured = true;
							this.selectorVerifier.updateSelectorHealth(selector, categories.featured, true);
							break;
						} else {
							this.selectorVerifier.updateSelectorHealth(selector, categories.featured, false);
						}
					} catch (error) {
						this.selectorVerifier.updateSelectorHealth(selector, categories.featured, false);
						continue;
					}
				}

				if (isFeatured) {
					recommendation.featured = true;
				}
			} catch (error) {
				// Featured status is optional
			}

			return recommendation;
		} catch (error) {
			logger.debug(`Error extracting recommendation item details: ${error instanceof Error ? error.message : String(error)}`);
			return null;
		}
	}

	private async extractInterests(driver: WebDriver): Promise<NonNullable<LinkedInProfileData['interests']>> {
		try {
			const interests: NonNullable<LinkedInProfileData['interests']> = [];
			const sectionSelectors = [
				'section#interests',
				'section.interests-section',
				'div[id*="interests"]'
			];

			for (const sectionSelector of sectionSelectors) {
				try {
					const section = await driver.findElement(By.css(sectionSelector));
					if (await section.isDisplayed()) {
						const items = await section.findElements(By.css('.pvs-list__item-container, .pv-interest-entity'));

						for (const item of items) {
							try {
								const nameElement = await item.findElement(By.css('.pvs-entity__title-text, .pv-entity__summary-title-text'));
								const name = await nameElement.getText() || '';

								if (!name) continue;

								const interest: NonNullable<LinkedInProfileData['interests']>[number] = {
									name
								};

								try {
									const categoryElement = await item.findElement(By.css('.pvs-entity__subtitle-text, .pv-entity__summary-subtitle'));
									const category = await categoryElement.getText() || '';
									if (category) interest.category = category;
								} catch (error) {
									// Category is optional
								}

								try {
									const followersElement = await item.findElement(By.css('.pvs-entity__caption-text, .pv-entity__follower-count'));
									const followersText = await followersElement.getText() || '';
									const match = followersText.match(/(\d+,?\d*)\s*followers?/i);
									if (match) {
										interest.followers = parseInt(match[1].replace(/,/g, ''), 10);
									}
								} catch (error) {
									// Followers count is optional
								}

								interests.push(interest);
							} catch (error) {
								continue;
							}
						}

						if (interests.length > 0) break;
					}
				} catch (error) {
					continue;
				}
			}

			return interests;
		} catch (error) {
			logger.warn(`Error extracting interests: ${error instanceof Error ? error.message : String(error)}`);
			return [];
		}
	}

	/**
	 * Extract profile image URL
	 * @param driver WebDriver instance
	 * @returns Profile image URL
	 */
	private async extractProfilePicture(driver: WebDriver): Promise<string | undefined> {
		try {
			const profilePicElement = await driver.findElement(By.css('.pv-top-card-profile-picture__image'));
			return await profilePicElement.getAttribute('src');
		} catch (error) {
			return undefined;
		}
	}

	private async extractExperience(driver: WebDriver): Promise<Experience[]> {
		try {
			const experiences: Experience[] = [];
			const categories = {
				section: 'Experience Section',
				item: 'Experience Items',
				title: 'Experience Title',
				company: 'Experience Company',
				dates: 'Experience Date Range',
				description: 'Experience Description',
				location: 'Experience Location'
			};

			// First try to find the Experience section container
			const experienceSectionSelectors = [
				'section#experience',
				'section[data-section="experience"]',
				'section.artdeco-card.pv-profile-card.break-words',
				'div#experience',
				'div[data-field="experience"]',
				'div.pvs-list__outer-container'
			];

			// Try to expand all "See more" buttons in the experience section
			await this.clickExpandButtons(driver, experienceSectionSelectors);
			await randomDelay(1000, 2000); // Wait for content to load

			// Try different selectors for experience items
			const experienceItemSelectors = [
				'li.artdeco-list__item',
				'div.pvs-entity',
				'div.pv-entity__position-group',
				'div.pv-profile-section__card-item',
				'div.pv-entity__summary-info',
				'div.experience-item'
			];

			// Try to find the Experience section with any of our selectors
			for (const sectionSelector of experienceSectionSelectors) {
				try {
					const section = await driver.findElement(By.css(sectionSelector));
					if (await section.isDisplayed()) {
						// Record success for this section selector
						this.selectorVerifier.updateSelectorHealth(sectionSelector, categories.section, true);

						const items = await section.findElements(By.css(experienceItemSelectors.join(',')));

						for (const item of items) {
							try {
								if (await item.isDisplayed()) {
									const experienceItem = await this.extractExperienceDetails(item);
									if (experienceItem) {
										experiences.push(experienceItem);
									}
								}
							} catch (error) {
								logger.debug(`Error extracting experience item: ${error instanceof Error ? error.message : String(error)}`);
								continue;
							}
						}

						if (experiences.length > 0) {
							logger.info(`Successfully extracted ${experiences.length} experiences`);
							break; // Found experiences, no need to try other section selectors
						}
					} else {
						// Record failure - section not displayed
						this.selectorVerifier.updateSelectorHealth(sectionSelector, categories.section, false);
					}
				} catch (error) {
					// Record failure - selector didn't find an element
					this.selectorVerifier.updateSelectorHealth(sectionSelector, categories.section, false);
					continue;
				}
			}

			return experiences;
		} catch (error) {
			logger.error('Error extracting experience:', error);
			return [];
		}
	}

	private async extractExperienceDetails(item: WebElement): Promise<Experience | null> {
		try {
			const titleSelectors = [
				// 2024 Updated LinkedIn Experience Title Selectors
				'div.display-flex.flex-column.full-width span.mr1.t-bold span[aria-hidden="true"]',
				'span.t-16.t-bold.t-black span[aria-hidden="true"]',
				'div.pv-entity__summary-info-container span.t-bold span[aria-hidden="true"]',
				'div.pvs-entity div.pvs-entity__title-text span[aria-hidden="true"]',
				'div.pvs-list__outer-container span.t-bold span[aria-hidden="true"]',
				// Keep some original selectors as fallbacks
				'span.mr1.t-bold span[aria-hidden="true"]',
				'span.t-16.t-black.t-bold span[aria-hidden="true"]',
				'h3.t-16.t-black.t-bold',
				'div.pv-entity__summary-info h3',
				'div.pv-entity__role-details h3'
			];

			const companySelectors = [
				// 2024 Updated LinkedIn Experience Company Selectors
				'div.display-flex.flex-column.full-width span.t-14.t-normal span[aria-hidden="true"]',
				'div.t-14.t-normal.break-words span[aria-hidden="true"]',
				'div.pv-entity__secondary-title span[aria-hidden="true"]',
				'div.pvs-entity div.pvs-entity__caption-text span[aria-hidden="true"]',
				'div.pv-entity__company-summary-info span[aria-hidden="true"]',
				// Keep some original selectors as fallbacks
				'span.t-14.t-normal span[aria-hidden="true"]',
				'span.t-14.t-normal.t-black--light span[aria-hidden="true"]',
				'p.pv-entity__secondary-title',
				'span.pv-entity__secondary-title',
				'div.inline-show-more-text span[aria-hidden="true"]'
			];

			const dateRangeSelectors = [
				// 2024 Updated LinkedIn Experience Date Selectors
				'div.display-flex.flex-column.full-width span.t-14.t-normal.t-black--light span[aria-hidden="true"]',
				'div.pvs-entity__caption span.pvs-entity__caption-text span[aria-hidden="true"]',
				'div.t-14.t-normal.t-black--light span[aria-hidden="true"]',
				'div.pvs-entity__dates span[aria-hidden="true"]',
				'div.pv-entity__date-range-text span[aria-hidden="true"]',
				// Keep some original selectors as fallbacks
				'span.t-14.t-normal.t-black--light span[aria-hidden="true"]',
				'div.display-flex.align-items-center.t-14.t-normal.t-black--light span[aria-hidden="true"]',
				'h4.pv-entity__date-range span:not(:first-child)',
				'div.pv-entity__date-range span:not(:first-child)'
			];

			const locationSelectors = [
				// 2024 Updated LinkedIn Experience Location Selectors
				'div.display-flex.flex-column.full-width span.t-14.t-normal.t-black--light span[aria-hidden="true"]',
				'div.pvs-entity__caption.location span.pvs-entity__caption-text span[aria-hidden="true"]',
				'div.pv-entity__location-text span[aria-hidden="true"]',
				'span.pvs-entity__location span[aria-hidden="true"]',
				// Keep some original selectors as fallbacks
				'span.t-14.t-normal.t-black--light span[aria-hidden="true"]',
				'h4.pv-entity__location span:not(:first-child)',
				'div.pv-entity__location span:not(:first-child)'
			];

			const descriptionSelectors = [
				// 2024 Updated LinkedIn Experience Description Selectors
				'div.display-flex.flex-row.align-items-center div.inline-show-more-text span[aria-hidden="true"]',
				'div.pvs-list__outer-container div.inline-show-more-text span[aria-hidden="true"]',
				'div.pvs-entity__description span[aria-hidden="true"]',
				'div.pv-shared-text-with-see-more span[aria-hidden="true"]',
				// Keep some original selectors as fallbacks
				'div.inline-show-more-text span[aria-hidden="true"]',
				'div.pv-entity__description span[aria-hidden="true"]',
				'div.pv-entity__extra-details span[aria-hidden="true"]'
			];

			// Rest of the function remains the same
			const title = await this.extractTextFromElements(await item.findElements(By.css(titleSelectors.join(','))));
			const company = await this.extractTextFromElements(await item.findElements(By.css(companySelectors.join(','))));
			const dateRange = await this.extractTextFromElements(await item.findElements(By.css(dateRangeSelectors.join(','))));
			const location = await this.extractTextFromElements(await item.findElements(By.css(locationSelectors.join(','))));
			const description = await this.extractTextFromElements(await item.findElements(By.css(descriptionSelectors.join(','))));

			if (title || company) {
				return {
					title: title || '',
					company: company || '',
					dateRange: dateRange || '',
					location: location || '',
					description: description || ''
				};
			}
		} catch (error) {
			logger.error('Error extracting experience details:', error);
		}
		return null;
	}

	private async extractEducation(driver: WebDriver): Promise<Education[]> {
		try {
			const education: Education[] = [];

			// First try to find the Education section container
			const educationSectionSelectors = [
				'section#education',
				'section[data-section="education"]',
				'section.artdeco-card.pv-profile-card.break-words',
				'div#education',
				'div[data-field="education"]',
				'div.pvs-list__outer-container'
			];

			// Try to expand all "See more" buttons in the education section
			await this.clickExpandButtons(driver, educationSectionSelectors);
			await randomDelay(1000, 2000); // Wait for content to load

			// Try different selectors for education items
			const educationItemSelectors = [
				'li.artdeco-list__item',
				'div.pvs-entity',
				'div.pv-entity__degree-info',
				'div.pv-profile-section__card-item',
				'div.pv-entity__summary-info',
				'div.education-item'
			];

			for (const sectionSelector of educationSectionSelectors) {
				try {
					const section = await driver.findElement(By.css(sectionSelector));
					if (await section.isDisplayed()) {
						const items = await section.findElements(By.css(educationItemSelectors.join(',')));
						for (const item of items) {
							try {
								if (await item.isDisplayed()) {
									const educationItem = await this.extractEducationDetails(item);
									if (educationItem) {
										education.push(educationItem);
									}
								}
							} catch (error) {
								continue;
							}
						}
						if (education.length > 0) {
							break; // Found education entries, no need to try other section selectors
						}
					}
				} catch (error) {
					continue;
				}
			}

			return education;
		} catch (error) {
			logger.error('Error extracting education:', error);
			return [];
		}
	}

	private async extractEducationDetails(item: WebElement): Promise<Education | null> {
		try {
			const schoolSelectors = [
				// 2024 Updated LinkedIn Education School Selectors
				'div.display-flex.flex-column.full-width span.mr1.hoverable-link-text.t-bold span[aria-hidden="true"]',
				'div.pvs-entity__title-text span.t-16.t-bold span[aria-hidden="true"]',
				'div.pv-profile-card__school-name span[aria-hidden="true"]',
				'span.t-16.t-bold.t-black span[aria-hidden="true"]',
				'div.pvs-entity div.pvs-entity__title-text a span[aria-hidden="true"]',
				// Keep some original selectors as fallbacks
				'span.mr1.hoverable-link-text.t-bold span[aria-hidden="true"]',
				'h3.pv-entity__school-name',
				'div.pv-entity__degree-info h3',
				'div.pv-entity__school-info h3',
				'div.inline-show-more-text span[aria-hidden="true"]'
			];

			const degreeSelectors = [
				// 2024 Updated LinkedIn Education Degree Selectors
				'div.display-flex.flex-column.full-width span.t-14.t-normal span[aria-hidden="true"]',
				'div.pvs-entity__secondary-title span.t-14.t-normal span[aria-hidden="true"]',
				'div.pv-profile-card__degree-info span[aria-hidden="true"]',
				'div.t-14.t-normal.t-black span[aria-hidden="true"]',
				'div.pvs-entity div.pvs-entity__caption-text span[aria-hidden="true"]',
				// Keep some original selectors as fallbacks
				'span.t-14.t-normal span[aria-hidden="true"]',
				'span.pv-entity__comma-item',
				'p.pv-entity__degree-name span:not(:first-child)',
				'div.pv-entity__degree span:not(:first-child)',
				'div.pv-entity__degree-info p span:not(:first-child)'
			];

			const fieldOfStudySelectors = [
				// 2024 Updated LinkedIn Education Field of Study Selectors
				'div.display-flex.flex-column.full-width span.t-14.t-normal.t-black--light span[aria-hidden="true"]',
				'div.pvs-entity__secondary-subtitle span[aria-hidden="true"]',
				'div.pv-profile-card__field-of-study span[aria-hidden="true"]',
				'div.t-14.t-normal.t-black--light span[aria-hidden="true"]',
				'div.pvs-entity__minor-titles span[aria-hidden="true"]',
				// Keep some original selectors as fallbacks
				'span.t-14.t-normal.t-black--light span[aria-hidden="true"]',
				'p.pv-entity__fos span:not(:first-child)',
				'div.pv-entity__fos span:not(:first-child)',
				'div.pv-entity__field-of-study span:not(:first-child)'
			];

			const dateRangeSelectors = [
				// 2024 Updated LinkedIn Education Date Selectors
				'div.display-flex.flex-column.full-width span.t-14.t-normal.t-black--light span[aria-hidden="true"]',
				'div.pvs-entity__date-range span[aria-hidden="true"]',
				'div.pv-profile-card__date-range span[aria-hidden="true"]',
				'div.t-14.t-normal.t-black--light span[aria-hidden="true"]',
				'div.pvs-entity__timestamp span[aria-hidden="true"]',
				// Keep some original selectors as fallbacks
				'span.t-14.t-normal.t-black--light span[aria-hidden="true"]',
				'p.pv-entity__dates span:not(:first-child)',
				'div.pv-entity__dates span:not(:first-child)',
				'div.display-flex.align-items-center.t-14.t-normal.t-black--light span[aria-hidden="true"]'
			];

			const descriptionSelectors = [
				// 2024 Updated LinkedIn Education Description Selectors
				'div.display-flex.flex-row.align-items-center div.inline-show-more-text span[aria-hidden="true"]',
				'div.pvs-entity__description span[aria-hidden="true"]',
				'div.pv-shared-text-with-see-more span[aria-hidden="true"]',
				'div.pvs-list__outer-container div.inline-show-more-text span[aria-hidden="true"]',
				// Keep some original selectors as fallbacks
				'div.inline-show-more-text span[aria-hidden="true"]',
				'div.pv-entity__description span[aria-hidden="true"]',
				'div.pv-entity__extra-details span[aria-hidden="true"]'
			];

			const school = await this.extractTextFromElements(await item.findElements(By.css(schoolSelectors.join(','))));
			const degree = await this.extractTextFromElements(await item.findElements(By.css(degreeSelectors.join(','))));
			const fieldOfStudy = await this.extractTextFromElements(await item.findElements(By.css(fieldOfStudySelectors.join(','))));
			const dateRange = await this.extractTextFromElements(await item.findElements(By.css(dateRangeSelectors.join(','))));
			const description = await this.extractTextFromElements(await item.findElements(By.css(descriptionSelectors.join(','))));

			if (school || degree) {
				return {
					school: school || '',
					degree: degree || '',
					fieldOfStudy: fieldOfStudy || '',
					dateRange: dateRange || '',
					description: description || ''
				};
			}
		} catch (error) {
			logger.error('Error extracting education details:', error);
		}
		return null;
	}

	private async clickExpandButtons(driver: WebDriver, sectionSelectors: string[]): Promise<void> {
		try {
			const seeMoreSelectors = [
				'button.pv-profile-section__see-more-inline',
				'button.inline-show-more-text__button',
				'button.artdeco-button.artdeco-button--tertiary',
				'button.pvs-profile-section__action-button',
				'button[aria-label*="more"]',
				'button[aria-label*="Show more"]'
			];

			for (const sectionSelector of sectionSelectors) {
				try {
					const section = await driver.findElement(By.css(sectionSelector));
					if (await section.isDisplayed()) {
						for (const seeMoreSelector of seeMoreSelectors) {
							try {
								const buttons = await section.findElements(By.css(seeMoreSelector));
								for (const button of buttons) {
									if (await button.isDisplayed()) {
										await button.click();
										await randomDelay(500, 1000);
									}
								}
							} catch (error) {
								continue;
							}
						}
					}
				} catch (error) {
					continue;
				}
			}
		} catch (error) {
			logger.warn('Error clicking expand buttons:', error);
		}
	}

	private async setupDriver(linkedInAccount?: ILinkedInAccount, proxy?: IProxy): Promise<WebDriver> {
		try {
			// Either use the WebDriverManager or create a new instance
			if (linkedInAccount && proxy) {
				// Use the managed instance with specific account and proxy
				// The getDriver method expects (campaignId: string, options: {...})
				const campaignId = 'scraper-session'; // Default campaign ID for standalone scraping
				return await this.webDriverManager.getDriver(campaignId, {
					linkedInAccount,
					proxy,
					headless: CONFIG.BROWSER.HEADLESS
				});
			} else {
				// Create a standalone Chrome driver for general use
				const builder = new Builder().forBrowser('chrome');

				// Setup Chrome options
				const options = new chrome.Options();

				// Add common Chrome options
				options.addArguments('--disable-extensions');
				options.addArguments('--disable-gpu');
				options.addArguments('--no-sandbox');
				options.addArguments('--disable-dev-shm-usage');

				// Apply headless mode if configured
				if (CONFIG.BROWSER.HEADLESS) {
					options.addArguments('--headless=new');
				}

				// Apply window size
				options.windowSize({ width: 1920, height: 1080 });

				builder.setChromeOptions(options);
				return await builder.build();
			}
		} catch (error) {
			logger.error(`Error setting up WebDriver: ${error instanceof Error ? error.message : String(error)}`);
			throw error;
		}
	}

	/**
	 * Navigate to a LinkedIn profile page
	 * @param driver WebDriver instance
	 * @param profileUrl LinkedIn profile URL to navigate to
	 * @param linkedInAccount Optional LinkedIn account for authentication
	 * @param password Optional password for the LinkedIn account
	 * @returns The WebDriver instance (which may be a new instance if authentication occurred)
	 */
	private async navigateToProfile(driver: WebDriver, profileUrl: string, linkedInAccount?: ILinkedInAccount, password?: string): Promise<WebDriver> {
		try {
			const normalizedUrl = normalizeLinkedInUrl(profileUrl);
			logger.info(`Navigating to normalized profile URL: ${normalizedUrl}`);

			// Login to LinkedIn if an account is provided
			if (linkedInAccount) {
				logger.info(`Attempting to log in with LinkedIn account: ${linkedInAccount.username}`);

				// Get password - use provided password or try to decrypt from the account
				let accountPassword = password;
				if (!accountPassword) {
					accountPassword = linkedInAccount.getPassword();
					if (!accountPassword) {
						logger.error('Failed to get LinkedIn account password - neither provided nor decrypted');
						throw new Error('Failed to get LinkedIn account password');
					}
				}

				// Use the authentication service to login
				const loginResult = await linkedInAuthService.login(linkedInAccount, accountPassword);

				if (!loginResult.success) {
					logger.error(`Login error: ${loginResult.message}`);
					// Save page source and screenshot for diagnosis
					await this.takeScreenshot(driver, 'login-failed');
					throw new Error(`Failed to log in to LinkedIn: ${loginResult.message}`);
				}

				// Use the authenticated driver from the login result
				if (loginResult.driver) {
					// Quit current driver if different from the login result driver
					if (driver !== loginResult.driver) {
						try {
							await driver.quit();
						} catch (quitError) {
							logger.warn(`Error quitting driver: ${quitError instanceof Error ? quitError.message : String(quitError)}`);
						}
					}

					// Use the authenticated driver
					driver = loginResult.driver;
					logger.info('Successfully authenticated with LinkedIn');
				}

				// Check if we're already logged in
				const isLoggedIn = await this.isLoggedIn(driver);
				if (!isLoggedIn) {
					logger.warn('Not logged in after authentication attempt, screenshots may fail');
				} else {
					logger.info('Confirmed logged in status - proceeding to profile navigation');
				}

				// Navigate to the profile URL directly now that we're logged in
				logger.info(`Navigating to profile: ${normalizedUrl}`);
				await driver.get(normalizedUrl);
			} else {
				// If no account is provided, just navigate to the URL directly
				logger.info('No LinkedIn account provided, navigating directly');
				await driver.get(normalizedUrl);
			}

			// Wait for navigation to complete
			await randomDelay(3000, 5000);

			// Verify we're on the correct profile page
			const currentUrl = await driver.getCurrentUrl();

			// Check if we've been redirected to a sign-in page
			if (currentUrl.includes('/login') || currentUrl.includes('/checkpoint')) {
				logger.error(`Redirected to login page: ${currentUrl}`);
				await this.takeScreenshot(driver, 'login-redirect');
				throw new Error('Redirected to login page - authentication issue');
			}

			// Check if we're on a profile page
			const profileUrlPatterns = [
				/linkedin\.com\/in\//,
				/linkedin\.com\/pub\//,
				/linkedin\.com\/profile\//
			];

			const isOnProfilePage = profileUrlPatterns.some(pattern => pattern.test(currentUrl));

			if (!isOnProfilePage) {
				logger.error(`Not on a profile page. Current URL: ${currentUrl}`);
				await this.takeScreenshot(driver, 'not-profile-page');

				// Try to navigate to the profile again with a different approach
				logger.info(`Attempting to navigate to profile again: ${normalizedUrl}`);
				await driver.get(normalizedUrl);
				await randomDelay(3000, 5000);

				const retryUrl = await driver.getCurrentUrl();
				const isOnProfilePageRetry = profileUrlPatterns.some(pattern => pattern.test(retryUrl));

				if (!isOnProfilePageRetry) {
					logger.error(`Still not on a profile page after retry. Current URL: ${retryUrl}`);
					await this.takeScreenshot(driver, 'not-profile-page-retry');
					throw new Error(`Failed to navigate to profile page. Redirected to: ${retryUrl}`);
				}
			}

			logger.info(`Successfully landed on profile page: ${currentUrl}`);

			// Take a screenshot to verify we're on the profile page
			await this.takeScreenshot(driver, 'profile-page-initial');

			// Return the driver instance (which may be different if authentication occurred)
			return driver;
		} catch (error) {
			logger.error(`Error navigating to profile: ${error instanceof Error ? error.message : String(error)}`);

			// Additional diagnostics
			try {
				const currentUrl = await driver.getCurrentUrl();
				const pageTitle = await driver.getTitle();
				logger.error(`Current URL: ${currentUrl}, Page title: ${pageTitle}`);
				await this.takeScreenshot(driver, 'navigation-error');
			} catch (screenshotError) {
				logger.error(`Error taking screenshot: ${screenshotError instanceof Error ? screenshotError.message : String(screenshotError)}`);
			}

			throw error;
		}
	}

	private async isLoggedIn(driver: WebDriver): Promise<boolean> {
		try {
			// Check for elements that are present when logged in
			const loginIndicators = await driver.findElements(By.css('.global-nav__me, .feed-identity-module, [data-control-name="identity_welcome_message"]'));
			return loginIndicators.length > 0;
		} catch (error) {
			// If there's an error, assume not logged in
			return false;
		}
	}

	/**
	 * Takes a screenshot and saves it to the specified directory
	 * Also optionally saves the HTML source for better debugging and XPath determination
	 * @param driver WebDriver instance
	 * @param label Name identifier for the screenshot
	 * @param saveHtml Whether to save HTML source as well (default: true)
	 * @param directory Custom directory to save to (default: 'screenshots')
	 */
	private async takeScreenshot(
		driver: WebDriver,
		label: string,
		saveHtml = true,
		directory = 'screenshots'
	): Promise<void> {
		try {
			// Ensure the directory exists
			const baseDir = path.join(process.cwd(), 'data');
			const targetDir = path.join(baseDir, directory);
			await fs.mkdir(targetDir, { recursive: true });

			// Create a timestamp with timezone information for better debugging
			const timestamp = new Date().toISOString().replace(/:/g, '_');

			// Get the current URL and create a URL-based identifier
			let urlIdentifier = '';
			let currentUrl = '';
			let pageTitle = '';

			try {
				currentUrl = await driver.getCurrentUrl();
				pageTitle = await driver.getTitle();

				// Extract username from profile URL or use domain name
				const urlMatch = currentUrl.match(/linkedin\.com\/(in|pub)\/([^\/]+)/);
				if (urlMatch && urlMatch[2]) {
					urlIdentifier = urlMatch[2] + '_'; // Use LinkedIn username if available
				} else {
					// Use a portion of the URL to identify the page
					const urlParts = new URL(currentUrl);
					urlIdentifier = urlParts.hostname.replace(/\./g, '_') + '_' +
						urlParts.pathname.split('/').filter(Boolean).join('_') + '_';
				}
			} catch (urlError) {
				logger.warn(`Could not extract URL for screenshot: ${urlError instanceof Error ? urlError.message : String(urlError)}`);
				urlIdentifier = 'unknown_url_';
			}

			// Sanitize the identifier to remove invalid filename characters
			urlIdentifier = urlIdentifier.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50);

			// Format: label_urlIdentifier_timestamp.png
			const filename = `${label}_${urlIdentifier}${timestamp}.png`;
			const filePath = path.join(targetDir, filename);

			// Take the screenshot
			const screenshot = await driver.takeScreenshot();
			await fs.writeFile(filePath, screenshot, 'base64');

			logger.info(`Screenshot saved to ${filePath} (URL: ${currentUrl}, Title: ${pageTitle})`);

			// Also save the HTML source for better debugging and XPath determination if requested
			if (saveHtml) {
				try {
					const html = await driver.getPageSource();
					const htmlFilename = `${label}_${urlIdentifier}${timestamp}.html`;
					const htmlPath = path.join(targetDir, htmlFilename);
					await fs.writeFile(htmlPath, html);

					// Create an enhanced HTML file with metadata for easier XPath determination
					const enhancedHtmlFilename = `${label}_${urlIdentifier}${timestamp}_enhanced.html`;
					const enhancedHtmlPath = path.join(targetDir, enhancedHtmlFilename);

					// Add useful metadata to the HTML for debugging
					const enhancedHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>LinkedIn Page Snapshot - ${pageTitle}</title>
  <style>
    body { font-family: Arial, sans-serif; }
    .metadata {
      background: #f0f0f0;
      padding: 15px;
      margin-bottom: 20px;
      border-radius: 5px;
      border: 1px solid #ddd;
    }
    .original-content {
      border-top: 3px solid #0077b5;
      padding-top: 10px;
    }
    pre {
      background: #f8f8f8;
      padding: 10px;
      overflow: auto;
      font-family: monospace;
      border: 1px solid #ddd;
    }
    .tip {
      background: #e1f5fe;
      padding: 10px;
      border-left: 4px solid #0288d1;
      margin: 10px 0;
    }
  </style>
</head>
<body>
  <div class="metadata">
    <h1>LinkedIn Page Snapshot</h1>
    <p><strong>URL:</strong> ${currentUrl}</p>
    <p><strong>Title:</strong> ${pageTitle}</p>
    <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
    <p><strong>Screenshot:</strong> <a href="${filename}" target="_blank">${filename}</a></p>
    <p><strong>Raw HTML:</strong> <a href="${htmlFilename}" target="_blank">${htmlFilename}</a></p>

    <div class="tip">
      <h3>XPath Testing Tips:</h3>
      <p>To test XPath expressions in browser console:</p>
      <pre>$x("//your/xpath/here")</pre>
      <p>Common LinkedIn XPath patterns:</p>
      <pre>
// Profile name: //h1[contains(@class, 'text-heading-xlarge')]
// Headline: //div[contains(@class, 'text-body-medium')][1]
// About: //section[@id='about']//div[contains(@class, 'inline-show-more-text')]
// Experience items: //section[@id='experience-section']//li
// Skills: //section[@id='skills-section']//span[contains(@class, 'pv-skill-category-entity__name-text')]
      </pre>
    </div>
  </div>

  <div class="original-content">
    <h2>Original Page Content Below:</h2>
    ${html}
  </div>
</body>
</html>`;

					await fs.writeFile(enhancedHtmlPath, enhancedHtml);
					logger.info(`Enhanced HTML saved to ${enhancedHtmlPath} for better XPath determination`);
				} catch (htmlError) {
					logger.warn(`Could not save HTML source: ${htmlError instanceof Error ? htmlError.message : String(htmlError)}`);
				}
			}
		} catch (error) {
			logger.warn(`Error taking screenshot: ${error instanceof Error ? error.message : String(error)}`);

			// Try to log basic driver information even if screenshot fails
			try {
				const url = await driver.getCurrentUrl();
				const title = await driver.getTitle();
				logger.warn(`Failed screenshot context - URL: ${url}, Title: ${title}`);
			} catch (contextError) {
				logger.warn('Could not retrieve driver context information');
			}
		}
	}

	/**
	 * Specialized method for taking a screenshot of an element with XPath context
	 * @param driver WebDriver instance
	 * @param element WebElement to screenshot
	 * @param label Name identifier for the screenshot
	 * @param xpath XPath used to find this element (for reference)
	 */
	private async takeElementScreenshot(
		driver: WebDriver,
		element: WebElement,
		label: string,
		xpath?: string
	): Promise<void> {
		try {
			// Create a special directory for element screenshots
			const targetDir = path.join(process.cwd(), 'data', 'element-screenshots');
			await fs.mkdir(targetDir, { recursive: true });

			// Create timestamp and identifier
			const timestamp = new Date().toISOString().replace(/:/g, '_');
			let urlIdentifier = '';

			try {
				const currentUrl = await driver.getCurrentUrl();
				const urlParts = new URL(currentUrl);
				urlIdentifier = urlParts.pathname.split('/').filter(Boolean).join('_') + '_';
			} catch (error) {
				urlIdentifier = 'unknown_';
			}

			// Get element text if available (for better identification)
			let elementText = '';
			try {
				elementText = await element.getText();
				if (elementText.length > 20) {
					elementText = elementText.substring(0, 20) + '...';
				}
				elementText = elementText.replace(/[^a-zA-Z0-9_-]/g, '_');
				if (elementText) {
					elementText = '_' + elementText;
				}
			} catch (error) {
				// Ignore errors getting text
			}

			// Filename format: element_label_xpathAvailable_elementText_timestamp.png
			const xpathAvailable = xpath ? 'with-xpath_' : '';
			const filename = `element_${label}_${xpathAvailable}${urlIdentifier}${elementText}_${timestamp}.png`;
			const filePath = path.join(targetDir, filename);

			// Take a screenshot
			try {
				// Try to highlight the element first
				await driver.executeScript(
					"arguments[0].style.border='3px solid red'; arguments[0].style.backgroundColor='rgba(255,0,0,0.1)'",
					element
				);

				// Take screenshot of the page with highlighted element
				const screenshot = await driver.takeScreenshot();
				await fs.writeFile(filePath, screenshot, 'base64');

				// Save element details for reference
				if (xpath) {
					const detailsPath = path.join(targetDir, `${filename}.txt`);
					let details = `Element: ${label}\n`;
					details += `XPath: ${xpath}\n`;
					details += `Text: ${elementText}\n`;
					details += `Timestamp: ${new Date().toISOString()}\n`;

					try {
						const tagName = await element.getTagName();
						details += `Tag: ${tagName}\n`;
					} catch (error) {
						// Ignore errors
					}

					try {
						const attributes = await driver.executeScript(
							"let result = {}; " +
							"let attrs = arguments[0].attributes; " +
							"for(let i = 0; i < attrs.length; i++) { " +
							"  result[attrs[i].name] = attrs[i].value; " +
							"} " +
							"return result;",
							element
						);
						details += `Attributes: ${JSON.stringify(attributes, null, 2)}\n`;
					} catch (error) {
						// Ignore errors
					}

					await fs.writeFile(detailsPath, details);
				}

				// Remove the highlight
				await driver.executeScript(
					"arguments[0].style.border=''; arguments[0].style.backgroundColor=''",
					element
				);

				logger.info(`Element screenshot saved to ${filePath}`);
			} catch (error) {
				logger.warn(`Error taking element screenshot: ${error instanceof Error ? error.message : String(error)}`);
			}
		} catch (error) {
			logger.warn(`Error preparing element screenshot: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	private async scrollToBottom(driver: WebDriver): Promise<void> {
		try {
			// Scroll to bottom in increments
			let lastHeight = await driver.executeScript('return document.body.scrollHeight');

			while (true) {
				await driver.executeScript('window.scrollTo(0, document.body.scrollHeight)');
				await randomDelay(1000, 2000); // Wait for content to load

				const newHeight = await driver.executeScript('return document.body.scrollHeight');
				if (newHeight === lastHeight) {
					break;
				}
				lastHeight = newHeight;
			}

			// Scroll back to top
			await driver.executeScript('window.scrollTo(0, 0)');
			await randomDelay(1000, 2000);
		} catch (error) {
			logger.error(`Error scrolling profile: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	private async extractTextFromElements(elements: WebElement[]): Promise<string | undefined> {
		for (const element of elements) {
			try {
				if (await element.isDisplayed()) {
					const text = await element.getText();
					if (text && text.trim()) {
						return text.trim();
					}
				}
			} catch (error) {
				continue;
			}
		}
		return undefined;
	}

	private async findVisibleElement(driver: WebDriver, selectors: string[]): Promise<WebElement | null> {
		for (const selector of selectors) {
			try {
				const elements = await driver.findElements(By.css(selector));
				for (const element of elements) {
					if (await element.isDisplayed()) {
						return element;
					}
				}
			} catch (error) {
				continue;
			}
		}
		return null;
	}

	private async getTextContent(element: Promise<WebElement>): Promise<string | undefined> {
		try {
			const resolvedElement = await element;
			const text = await resolvedElement.getText();
			return text.trim() || undefined;
		} catch (error) {
			return undefined;
		}
	}

	/**
	 * Helper method to find elements by category using the SelectorVerifier
	 * @param driver WebDriver instance
	 * @param category Selector category
	 * @param multiple Whether to return multiple elements
	 * @returns Found element(s) or undefined
	 */
	private async findElementsByCategory(
		driver: WebDriver,
		category: string,
		multiple = false
	): Promise<WebElement | WebElement[] | undefined> {
		try {
			return await this.selectorVerifier.findElementByCategory(driver, category, multiple);
		} catch (error) {
			logger.warn(`Error finding elements by category ${category}: ${error instanceof Error ? error.message : String(error)}`);
			return undefined;
		}
	}

	/**
	 * Helper method for extracting text from an element
	 * @param element WebElement to extract text from
	 * @returns Text content or undefined
	 */
	private async getElementText(element: WebElement | undefined): Promise<string | undefined> {
		if (!element) return undefined;

		try {
			if (await element.isDisplayed()) {
				const text = await element.getText();
				return text && text.trim() ? text.trim() : undefined;
			}
		} catch (error) {
			logger.debug(`Error getting element text: ${error instanceof Error ? error.message : String(error)}`);
		}

		return undefined;
	}

	/**
	 * Get text from the first matching element of a category
	 * @param driver WebDriver instance
	 * @param category Selector category
	 * @returns Text content or undefined
	 */
	private async getTextByCategory(driver: WebDriver, category: string): Promise<string | undefined> {
		const element = await this.findElementsByCategory(driver, category) as WebElement | undefined;
		return await this.getElementText(element);
	}

	/**
	 * Get texts from all matching elements of a category
	 * @param driver WebDriver instance
	 * @param category Selector category
	 * @returns Array of text content
	 */
	private async getTextsByCategory(driver: WebDriver, category: string): Promise<string[]> {
		const elements = await this.findElementsByCategory(driver, category, true) as WebElement[] | undefined;

		if (!elements || elements.length === 0) {
			return [];
		}

		const result: string[] = [];

		for (const element of elements) {
			try {
				if (await element.isDisplayed()) {
					const text = await element.getText();
					if (text && text.trim()) {
						result.push(text.trim());
					}
				}
			} catch (error) {
				continue;
			}
		}

		return result;
	}

	/**
	 * Extract projects from the profile
	 * @param driver WebDriver instance
	 * @returns Array of projects
	 */
	private async extractProjects(driver: WebDriver): Promise<any[]> {
		try {
			logger.info('Extracting projects data');

			// Try to find the projects section
			const projectsSection = await this.selectorVerifier.findElementByCategory(
				driver,
				'Projects Section',
				false,
				true // Take a screenshot for debugging
			);

			if (!projectsSection) {
				logger.info('No projects section found');
				return [];
			}

			// Find all project items
			const projectElements = await this.selectorVerifier.findElementByCategory(
				driver,
				'Project Items',
				true,
				true
			) as WebElement[];

			if (!projectElements || projectElements.length === 0) {
				logger.info('No project items found');
				return [];
			}

			logger.info(`Found ${projectElements.length} projects`);

			// Extract data from each project
			const projects = [];
			for (const projectElement of projectElements) {
				try {
					// Extract project name
					let name = '';
					try {
						const nameElement = await projectElement.findElement(By.xpath(".//span[contains(@class, 'project-name')]"));
						name = await nameElement.getText();
					} catch (error) {
						// Try alternate selectors
						try {
							const nameElements = await projectElement.findElements(By.xpath(".//h3 | .//h4"));
							if (nameElements.length > 0) {
								name = await nameElements[0].getText();
							}
						} catch (innerError) {
							// Ignore
						}
					}

					// Extract dates
					let dates = '';
					try {
						const dateElement = await projectElement.findElement(By.xpath(".//span[contains(@class, 'date-range')]"));
						dates = await dateElement.getText();
					} catch (error) {
						// Ignore error
					}

					// Extract description
					let description = '';
					try {
						const descElement = await projectElement.findElement(By.xpath(".//p[contains(@class, 'description')] | .//div[contains(@class, 'description')]"));
						description = await descElement.getText();
					} catch (error) {
						// Ignore error
					}

					projects.push({
						name,
						dates,
						description
					});
				} catch (error) {
					logger.warn(`Error extracting project data: ${error instanceof Error ? error.message : String(error)}`);
				}
			}

			return projects;
		} catch (error) {
			logger.warn(`Error in extractProjects: ${error instanceof Error ? error.message : String(error)}`);
			return [];
		}
	}

	/**
	 * Login to LinkedIn
	 * @param driver WebDriver instance
	 * @param account LinkedIn account credentials
	 * @returns Whether login was successful
	 */
	private async login(driver: WebDriver, account: ILinkedInAccount): Promise<boolean> {
		try {
			// Extract email and password from account
			const email = account.email || '';
			const password = (account as LinkedInAccountWithPassword).password || account.getPassword?.() || '';

			// Navigate to LinkedIn login page
			await driver.get('https://www.linkedin.com/login');
			logger.info('Navigating to LinkedIn login page: https://www.linkedin.com/login');

			// Take screenshot of login page
			await this.takeScreenshot(driver, 'login-page-initial');

			// Check if we're on the login page
			const currentUrl = await driver.getCurrentUrl();
			logger.info(`Checking if on login page. Current URL: ${currentUrl}`);

			if (currentUrl.includes('/login') || currentUrl.includes('/checkpoint')) {
				logger.info('URL contains /login or /checkpoint, confirming we are on login page');

				// Handle standard login flow
				logger.info('On standard login page, proceeding with normal login flow');

				// Find the username field
				const usernameInput = await driver.findElement(By.id('username'));
				await usernameInput.clear();
				await usernameInput.sendKeys(email);

				// Find the password field
				const passwordInput = await driver.findElement(By.id('password'));
				await passwordInput.clear();
				await passwordInput.sendKeys(password);

				// Take screenshot before clicking login
				await this.takeScreenshot(driver, 'login-page-filled');

				// Click the login button
				const signInButton = await driver.findElement(By.css('button[type="submit"]'));
				await signInButton.click();

				// Wait for navigation
				await driver.sleep(5000);

				// Take screenshot after login attempt
				await this.takeScreenshot(driver, 'post-login');

				// Check if we're logged in
				const newUrl = await driver.getCurrentUrl();
				logger.info(`Post-login URL: ${newUrl}`);

				if (!newUrl.includes('/login') && !newUrl.includes('/checkpoint')) {
					logger.info('Login successful');
					return true;
				} else {
					// Check for security verification
					const pageSource = await driver.getPageSource();

					if (pageSource.includes('security verification') ||
						pageSource.includes('unusual activity') ||
						pageSource.includes('verify your identity')) {
						logger.warn('Security verification required. Please handle this manually.');
						// Take additional screenshot
						await this.takeScreenshot(driver, 'security-verification-required');
						// Wait for potential manual intervention
						await driver.sleep(30000);
						return true; // Optimistically assume user handled verification
					}

					logger.warn('Login failed. Still on login page.');
					return false;
				}
			} else if (currentUrl.includes('linkedin.com')) {
				// Already logged in
				logger.info('Already logged into LinkedIn');
				return true;
			} else {
				logger.warn(`Unexpected URL after login attempt: ${currentUrl}`);
				return false;
			}
		} catch (error) {
			logger.error(`Error during LinkedIn login: ${error instanceof Error ? error.message : String(error)}`);
			return false;
		}
	}

	/**
	 * Generate a unique metadata ID for a profile
	 * @param profileUrl LinkedIn profile URL
	 * @returns Metadata ID
	 */
	private generateMetadataId(profileUrl: string): string {
		try {
			// Try to extract the LinkedIn username/ID from the URL
			const matches = profileUrl.match(/linkedin\.com\/(in|pub)\/([^\/\?]+)/i);
			if (matches && matches[2]) {
				const username = matches[2].toLowerCase();
				return `linkedin_${username}_${Date.now()}`;
			}

			// Fallback: create a hash of the full URL
			return `linkedin_profile_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
		} catch (error) {
			// Handle any errors by returning a timestamp-based ID
			return `linkedin_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
		}
	}
}

export default LinkedInProfileScraper.getInstance();
