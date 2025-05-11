import { WebDriver, By, Key, until, WebElement } from 'selenium-webdriver';
import { randomDelay, humanTypeText } from '../../utils/delay';
import logger from '../../utils/logger';
import { extractCompanyFromUrl, extractProfileId, tryParseCompanySize } from '../../utils/linkedin.utils';
import seleniumService from '../selenium/SeleniumService';
import PreviousLeads from '../../models/previousLeads.model';
import Lead from '../../models/lead.model';
import { Types } from 'mongoose';
import path from 'path';
import fs from 'fs';

/**
 * Interface for search filters
 */
export interface SearchFilters {
  locations?: string[];
  jobTitles?: string[];
  industries?: string[];
  companies?: string[];
  connectionDegree?: string[]; // '1st', '2nd', '3rd'
  pastCompanies?: string[];
}

/**
 * Interface for search parameters
 */
export interface SearchParams {
  keywords: string;
  filters?: SearchFilters;
  page?: number;
  maxResults?: number;
  campaignId?: string; // Optional campaign ID for lead tracking
}

/**
 * Interface for search result profile
 */
export interface SearchResultProfile {
  profileId: string;
  profileUrl: string;
  name: string;
  headline?: string;
  location?: string;
  currentCompany?: string;
  connectionDegree?: string;
  imageUrl?: string;
  isOpenToWork?: boolean;
}

/**
 * Interface for search result
 */
export interface SearchResult {
  profiles: SearchResultProfile[];
  totalResults: number;
  page: number;
  hasNextPage: boolean;
}

/**
 * Service for LinkedIn search functionality
 */
class LinkedInSearchService {
  private static instance: LinkedInSearchService;
  private readonly SEARCH_BASE_URL = 'https://www.linkedin.com/search/results/people/';

  private constructor() {}

  /**
   * Get singleton instance
   * @returns LinkedInSearchService instance
   */
  public static getInstance(): LinkedInSearchService {
    if (!LinkedInSearchService.instance) {
      LinkedInSearchService.instance = new LinkedInSearchService();
    }
    return LinkedInSearchService.instance;
  }

  /**
   * Search for LinkedIn profiles
   * @param driver WebDriver instance
   * @param params Search parameters
   * @returns Array of search result profiles
   */
  public async search(driver: WebDriver, params: SearchParams): Promise<SearchResultProfile[]> {
    try {
      logger.info(`Starting LinkedIn search with keywords: ${params.keywords}`);

      // Try direct search input approach first (more reliable)
      const directSearchSuccess = await this.performDirectSearch(driver, params);

      // If direct search failed, fall back to URL-based approach
      if (!directSearchSuccess) {
        logger.info('Direct search failed, trying URL-based approach...');

        // Build search URL with filters
        const searchUrl = this.buildSearchUrl(params);
        logger.info(`Using search URL: ${searchUrl}`);

        // Navigate to search URL
        await driver.get(searchUrl);

        // Take a screenshot right after navigation
        await this.saveSearchPageScreenshot(driver, 'initial-search-page');

        // Wait longer for the page to fully load (LinkedIn can be slow)
        await randomDelay(8000, 12000);
      }

      // Handle any security popups that might appear
      await this.handleSecurityPopups(driver);

      // Check for additional filters that can't be applied via URL
      if (params.filters) {
        logger.info(`Applying additional filters: ${JSON.stringify(params.filters)}`);
        await this.applyAdvancedFilters(driver, params.filters);
      }

      // Wait for search results container with an increased timeout
      try {
        const resultsContainerSelectors = [
          '.search-results-container',
          '.reusable-search__entity-results-list',
          '.scaffold-layout__list',
          'div.search-results'
        ];

        let resultsContainerFound = false;

        for (const selector of resultsContainerSelectors) {
          try {
            logger.info(`Waiting for results container with selector: ${selector}`);
            await driver.wait(until.elementLocated(By.css(selector)), 15000);
            resultsContainerFound = true;
            logger.info(`Found results container with selector: ${selector}`);
            break;
          } catch (e) {
            logger.warn(`Selector ${selector} not found, trying next`);
          }
        }

        if (!resultsContainerFound) {
          logger.warn("Could not find any results container selector. Taking screenshot for debugging.");
          await this.saveSearchPageScreenshot(driver, 'no-results-container');
        }
      } catch (timeoutError) {
        logger.error(`Timeout waiting for search results: ${timeoutError instanceof Error ? timeoutError.message : String(timeoutError)}`);
        await this.saveSearchPageScreenshot(driver, 'search-results-timeout');
      }

      // Extract results
      const maxResults = params.maxResults || 10;
      let results: SearchResultProfile[] = [];
      let currentPage = 1;
      let hasMorePages = true;

      // Wait a bit longer for the initial page to fully render
      await randomDelay(5000, 8000);

      // Extract results from current page
      while (results.length < maxResults && hasMorePages) {
        logger.info(`Extracting results from page ${currentPage}`);

        // Extract profiles from current page
        const pageResults = await this.extractSearchResults(driver);

        if (pageResults.length === 0) {
          logger.warn(`No results found on page ${currentPage}. Taking screenshot for debugging.`);
          await this.saveSearchPageScreenshot(driver, `empty-results-page-${currentPage}`);

          // If we're on page 1 with no results, try to recover
          if (currentPage === 1) {
            // Try to perform a direct search if we haven't already
            if (!directSearchSuccess) {
              logger.info("Attempting direct search as recovery mechanism...");
              await this.performDirectSearch(driver, params);

              // Extract profiles again after recovery attempt
              const recoveryResults = await this.extractSearchResults(driver);
              if (recoveryResults.length > 0) {
                logger.info(`Recovery successful! Found ${recoveryResults.length} results after direct search`);
                pageResults.push(...recoveryResults);
              }
            }
          }
        } else {
          logger.info(`Found ${pageResults.length} results on page ${currentPage}`);
        }

		  logger.info(`Total profiles: ${JSON.stringify(pageResults)} || Campaign ID: ${params.campaignId}`);
        // Process results (check for duplicates, create leads)
        if (pageResults.length > 0) {
          const processedResults = await this.processSearchResults(pageResults, params.campaignId);
          results = [...results, ...processedResults];
          logger.info(`Total processed results so far: ${results.length} of ${maxResults} requested`);
        }

        // Check if we need to go to next page
        if (results.length < maxResults) {
          hasMorePages = await this.goToNextPage(driver);
          if (hasMorePages) {
            currentPage++;
            await randomDelay(5000, 8000); // Longer delay between pages
          } else {
            logger.info(`No more pages available after page ${currentPage}`);
          }
        } else {
          break;
        }
      }

      // Limit to max results
      results = results.slice(0, maxResults);

      logger.info(`LinkedIn search completed with ${results.length} results`);
      return results;
    } catch (error) {
      logger.error(`LinkedIn search error: ${error instanceof Error ? error.message : String(error)}`);
      await this.saveSearchPageScreenshot(driver, 'search-error');
      throw new Error(`LinkedIn search failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Performs a direct search using the search input field
   * This is often more reliable than URL-based search
   * @param driver WebDriver instance
   * @param params Search parameters
   * @returns Boolean indicating if the direct search was successful
   */
  private async performDirectSearch(driver: WebDriver, params: SearchParams): Promise<boolean> {
    try {
      logger.info("Performing direct search using search input field...");

      // Navigate to LinkedIn home page
      await driver.get("https://www.linkedin.com/feed/");
      await randomDelay(5000, 8000);

      // Take a screenshot before search
      await this.saveSearchPageScreenshot(driver, 'before-direct-search');

      // Find the search input field
      const searchInputSelectors = [
        'input[placeholder*="Search"]',
        'input[role="combobox"]',
        'input.search-global-typeahead__input',
        '.search-global-typeahead__input', // Class-based approach
        'input[type="text"][aria-label*="Search"]'
      ];

      let searchInput = null;
      for (const selector of searchInputSelectors) {
        try {
          const inputs = await driver.findElements(By.css(selector));
          if (inputs.length > 0) {
            searchInput = inputs[0];
            logger.info(`Found search input with selector: ${selector}`);
            break;
          }
        } catch (error) {
          logger.debug(`Selector ${selector} failed: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      if (!searchInput) {
        logger.warn("Could not find search input field. Taking screenshot.");
        await this.saveSearchPageScreenshot(driver, 'no-search-input');
        return false;
      }

      // Clear the input and type the search query
      await searchInput.clear();
      await humanTypeText(searchInput, params.keywords);
      await searchInput.sendKeys(Key.ENTER);

      // Wait for search to complete
      await randomDelay(8000, 12000);

      // Take a screenshot after search
      await this.saveSearchPageScreenshot(driver, 'after-direct-search');

      // Click on "People" filter to ensure we're searching for people
      try {
        const peopleTabSelectors = [
          'button[aria-label="People"]',
          'a[href*="search/results/people"]',
          'li[data-test-search-filter="PEOPLE"]',
          'a.search-reusables__filter-pill[href*="people"]',
          'button.search-reusables__filter-pill'
        ];

        let peopleTab = null;
        for (const selector of peopleTabSelectors) {
          const elements = await driver.findElements(By.css(selector));
          if (elements.length > 0) {
            peopleTab = elements[0];
            logger.info(`Found people tab with selector: ${selector}`);
            break;
          }
        }

        if (peopleTab) {
          await peopleTab.click();
          await randomDelay(5000, 8000);
          logger.info("Clicked on People tab");

          // Screenshot after clicking people tab
          await this.saveSearchPageScreenshot(driver, 'after-people-tab');
        } else {
          // Try using XPath as a backup
          const xpathElements = await driver.findElements(
            By.xpath('//button[contains(@aria-label, "People")] | //a[contains(@href, "people")]')
          );

          if (xpathElements.length > 0) {
            await xpathElements[0].click();
            await randomDelay(5000, 8000);
            logger.info("Clicked on People tab using XPath");
          } else {
            logger.warn("Could not find People tab. May be showing mixed results.");
          }
        }
      } catch (filterError) {
        logger.warn(`Error clicking on People filter: ${filterError instanceof Error ? filterError.message : String(filterError)}`);
      }

      return true;
    } catch (error) {
      logger.error(`Error during direct search: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * Build search URL with filters
   * @param params Search parameters
   * @returns Search URL
   */
  private buildSearchUrl(params: SearchParams): string {
    let url = this.SEARCH_BASE_URL;
    const queryParams: string[] = [];

    // Add keywords
    if (params.keywords) {
      queryParams.push(`keywords=${encodeURIComponent(params.keywords)}`);
    }

    // Add filters if available
    if (params.filters) {
      const { locations, companies, connectionDegree } = params.filters;

      // Add location filter
      if (locations && locations.length > 0) {
        const locationFilters = locations.map(loc =>
          `locationFilter.${encodeURIComponent(`geoUrn:"${loc}"`)}`
        );
        queryParams.push(...locationFilters);
      }

      // Add company filter
      if (companies && companies.length > 0) {
        const companyFilters = companies.map(company =>
          `currentCompany.${encodeURIComponent(`["${company}"]`)}`
        );
        queryParams.push(...companyFilters);
      }

      // Add connection degree filter
      if (connectionDegree && connectionDegree.length > 0) {
        const degreeMapping: Record<string, string> = {
          '1st': 'F',
          '2nd': 'S',
          '3rd': 'O'
        };

        const connFilters = connectionDegree
          .filter(degree => degreeMapping[degree])
          .map(degree => `network=${degreeMapping[degree]}`);

        queryParams.push(...connFilters);
      }
    }

    // Add origin (to indicate the search is people search)
    queryParams.push('origin=GLOBAL_SEARCH_HEADER');

    // Add page if specified
    if (params.page && params.page > 1) {
      queryParams.push(`page=${params.page}`);
    }

    // Join URL and parameters
    if (queryParams.length > 0) {
      url += `?${queryParams.join('&')}`;
    }

    logger.debug(`Built search URL: ${url}`);
    return url;
  }

  /**
   * Apply advanced filters that can't be added to URL
   * @param driver WebDriver instance
   * @param filters Search filters
   */
  private async applyAdvancedFilters(driver: WebDriver, filters: SearchFilters): Promise<void> {
    try {
      const { jobTitles, industries, pastCompanies } = filters;

      // Check if we have any advanced filters to apply
      if (!jobTitles && !industries && !pastCompanies) {
        return;
      }

      // Click on the "All filters" button
      const allFiltersButton = await driver.findElements(By.css('button[aria-label="All filters"]'));
      if (allFiltersButton.length > 0) {
        await allFiltersButton[0].click();
        await randomDelay(1000, 2000);

        // Apply job title filters
        if (jobTitles && jobTitles.length > 0) {
          await this.applyJobTitleFilters(driver, jobTitles);
        }

        // Apply industry filters
        if (industries && industries.length > 0) {
          await this.applyIndustryFilters(driver, industries);
        }

        // Apply past company filters
        if (pastCompanies && pastCompanies.length > 0) {
          await this.applyPastCompanyFilters(driver, pastCompanies);
        }

        // Apply filters by clicking the "Show results" button
        const showResultsButton = await driver.findElement(By.css('button[aria-label="Apply current filters to show results"]'));
        await showResultsButton.click();
        await randomDelay(2000, 3000);
      }
    } catch (error) {
      logger.warn(`Error applying advanced filters: ${error instanceof Error ? error.message : String(error)}`);
      // Continue with search even if filter application fails
    }
  }

  /**
   * Apply job title filters
   * @param driver WebDriver instance
   * @param jobTitles Array of job titles
   */
  private async applyJobTitleFilters(driver: WebDriver, jobTitles: string[]): Promise<void> {
    try {
      // Click on Title section
      const titleSection = await driver.findElements(By.xpath('//h3[text()="Title"]'));
      if (titleSection.length > 0) {
        await titleSection[0].click();
        await randomDelay(500, 1000);

        // Add each job title
        for (const title of jobTitles) {
          const titleInput = await driver.findElement(By.css('input[placeholder="Add a title"]'));
          await titleInput.clear();
          await humanTypeText(titleInput, title);
          await randomDelay(500, 1000);

          // Press enter to add the title
          await titleInput.sendKeys(Key.ENTER);
          await randomDelay(500, 1000);
        }

        // Close the Title section
        await titleSection[0].click();
        await randomDelay(500, 1000);
      }
    } catch (error) {
      logger.warn(`Error applying job title filters: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Apply industry filters
   * @param driver WebDriver instance
   * @param industries Array of industries
   */
  private async applyIndustryFilters(driver: WebDriver, industries: string[]): Promise<void> {
    try {
      // Click on Industry section
      const industrySection = await driver.findElements(By.xpath('//h3[text()="Industry"]'));
      if (industrySection.length > 0) {
        await industrySection[0].click();
        await randomDelay(500, 1000);

        // Add each industry
        for (const industry of industries) {
          const industryInput = await driver.findElement(By.css('input[placeholder="Add an industry"]'));
          await industryInput.clear();
          await humanTypeText(industryInput, industry);
          await randomDelay(500, 1000);

          // Press enter to add the industry
          await industryInput.sendKeys(Key.ENTER);
          await randomDelay(500, 1000);
        }

        // Close the Industry section
        await industrySection[0].click();
        await randomDelay(500, 1000);
      }
    } catch (error) {
      logger.warn(`Error applying industry filters: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Apply past company filters
   * @param driver WebDriver instance
   * @param companies Array of past companies
   */
  private async applyPastCompanyFilters(driver: WebDriver, companies: string[]): Promise<void> {
    try {
      // Click on Past company section
      const pastCompanySection = await driver.findElements(By.xpath('//h3[text()="Past company"]'));
      if (pastCompanySection.length > 0) {
        await pastCompanySection[0].click();
        await randomDelay(500, 1000);

        // Add each past company
        for (const company of companies) {
          const companyInput = await driver.findElement(By.css('input[placeholder="Add a past company"]'));
          await companyInput.clear();
          await humanTypeText(companyInput, company);
          await randomDelay(500, 1000);

          // Press enter to add the company
          await companyInput.sendKeys(Key.ENTER);
          await randomDelay(500, 1000);
        }

        // Close the Past company section
        await pastCompanySection[0].click();
        await randomDelay(500, 1000);
      }
    } catch (error) {
      logger.warn(`Error applying past company filters: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Extract search results from current page
   * @param driver WebDriver instance
   * @returns Array of extracted profiles
   */
  private async extractSearchResults(driver: WebDriver): Promise<SearchResultProfile[]> {
    try {
      // Save a screenshot for debugging
      await this.saveSearchPageScreenshot(driver, 'search-results-page');

      // Get the page source for debugging
      const pageSource = await driver.getPageSource();
      logger.debug(`Page source length: ${pageSource.length}`);

      // Minimal wait for initial render
      await driver.sleep(1000);

      const profiles: SearchResultProfile[] = [];

      logger.info('Searching for profile cards on the page...');

      // Try multiple selectors to find profile cards - updated for 2024 LinkedIn UI
      const selectors = [
        'div.search-results-container div.entity-result',
        'ul.reusable-search__entity-result-list li.reusable-search__result-container',
        'div.search-results div.entity-result',
        'div.scaffold-layout__list div.entity-result',
        'div.search-results-container li.reusable-search__result-container',
        'div[data-test-search-result="PROFILE"]',
        'div[data-chameleon-result-urn]',
        'div.entity-result__item',
        'li.artdeco-list__item'
      ];

      // Use Promise.race to get results from the first successful selector
      const profileCardsPromises = selectors.map(selector =>
        driver.findElements(By.css(selector))
          .then(elements => ({ elements, selector }))
          .catch(() => ({ elements: [], selector }))
      );

      const { elements: profileCards, selector: successfulSelector } = await Promise.race(
        profileCardsPromises.map(async p => {
          const result = await p;
          return result.elements.length > 0 ? result : Promise.reject();
        })
      ).catch(() => ({ elements: [], selector: '' }));

      if (profileCards.length === 0) {
        logger.warn('No profile cards found with any selector');
        return [];
      }

      logger.info(`Found ${profileCards.length} profile cards using selector: ${successfulSelector}`);

      // Process profile cards in parallel batches to improve performance
      const batchSize = 5;
      for (let i = 0; i < profileCards.length; i += batchSize) {
        const batch = profileCards.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          batch.map(async (card, index) => {
            try {
              const profile: SearchResultProfile = {
                profileId: '',
                profileUrl: '',
                name: '',
              };

              // Extract profile link
              const profileLink = await this.extractProfileLink(card);
              if (!profileLink) {
                return null;
              }

              const hrefAttr = await profileLink.getAttribute('href');
              profile.profileUrl = hrefAttr;
              profile.profileId = extractProfileId(hrefAttr);

              // Extract name and headline in parallel
              const [nameResult, headlineResult] = await Promise.all([
                this.extractProfileName(card),
                this.extractProfileHeadline(card)
              ]);

              profile.name = nameResult;
              profile.headline = headlineResult;

              // Extract location and current company if headline is found
              if (profile.headline) {
                const [locationResult, companyResult] = await Promise.all([
                  this.extractLocation(card),
                  this.extractCurrentCompany(profile.headline)
                ]);

                profile.location = locationResult;
                profile.currentCompany = companyResult;
              }

              // Extract remaining fields in parallel
              const [connectionDegree, imageUrl, isOpenToWork] = await Promise.all([
                this.extractConnectionDegree(card),
                this.extractProfileImage(card),
                this.checkOpenToWork(card)
              ]);

              profile.connectionDegree = connectionDegree;
              profile.imageUrl = imageUrl;
              profile.isOpenToWork = isOpenToWork;

              return profile.profileId && profile.name ? profile : null;
            } catch (error) {
              logger.debug(`Error processing profile card ${i + index + 1}: ${error instanceof Error ? error.message : String(error)}`);
              return null;
            }
          })
        );

        // Add valid profiles from the batch
        profiles.push(...batchResults.filter((p): p is SearchResultProfile => p !== null));
      }

      logger.info(`Successfully extracted ${profiles.length} valid profiles`);
      return profiles;
    } catch (error) {
      logger.error(`Error extracting search results: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  private async extractProfileLink(card: WebElement): Promise<WebElement | null> {
    const selectors = [
      'span.entity-result__title-text a',
      'span.entity-result__title a',
      'div.entity-result__title a',
      'a.app-aware-link[href*="/in/"]',
      'a[data-field="title"]',
      'a.entity-result__title-link',
      'a.search-result__result-link',
      'a[data-control-name="search_srp_result"]'
    ];

    for (const selector of selectors) {
      try {
        const links = await card.findElements(By.css(selector));
        if (links.length > 0) {
          return links[0];
        }
      } catch (error) {
        continue;
      }
    }

    // Try XPath as fallback
    try {
      const xpathLinks = await card.findElements(By.xpath('.//a[contains(@href, "/in/")]'));
      if (xpathLinks.length > 0) {
        return xpathLinks[0];
      }
    } catch (error) {
      // Ignore XPath errors
    }

    return null;
  }

  private async extractProfileName(card: WebElement): Promise<string> {
    const selectors = [
      'span.entity-result__title-text span span',
      'span.entity-result__title-text',
      'div.entity-result__title-text',
      'span.name-and-icon span span',
      'span.name-and-distance span span',
      'h3.entity-result__title',
      'span.entity-result__title span'
    ];

    for (const selector of selectors) {
      try {
        const element = await card.findElement(By.css(selector));
        const name = await element.getText();
        if (name && name.trim()) {
          return name.trim();
        }
      } catch (error) {
        continue;
      }
    }

    return '';
  }

  private async extractProfileHeadline(card: WebElement): Promise<string | undefined> {
    const selectors = [
      'div.entity-result__primary-subtitle',
      'div.entity-result__summary',
      'p.entity-result__summary',
      'div.linked-area__primary-description',
      'div.search-result__info-container p.subline-level-1',
      'div.entity-result__secondary-subtitle',
      'div[data-field="headline"]'
    ];

    for (const selector of selectors) {
      try {
        const element = await card.findElement(By.css(selector));
        const headline = await element.getText();
        if (headline && headline.trim()) {
          return headline.trim();
        }
      } catch (error) {
        continue;
      }
    }

    return undefined;
  }

  private async extractLocation(card: WebElement): Promise<string | undefined> {
    const selectors = [
      '.entity-result__secondary-subtitle',
      '.entity-result__location',
      '.presence-entity__image + span'
    ];

    for (const selector of selectors) {
      try {
        const element = await card.findElement(By.css(selector));
        const location = await element.getText();
        if (location && location.trim()) {
          return location.trim();
        }
      } catch (error) {
        continue;
      }
    }

    return undefined;
  }

  private extractCurrentCompany(headline: string): string | undefined {
    const companyPatterns = [
      /at\s+([^•]+)/i,
      /at\s+([\w\s&\-,.']+)/i,
      /at\s+(.*?)(?:$|\s+•)/i
    ];

    for (const pattern of companyPatterns) {
      const companyMatch = headline.match(pattern);
      if (companyMatch && companyMatch[1]) {
        return companyMatch[1].trim();
      }
    }

    return undefined;
  }

  private async extractConnectionDegree(card: WebElement): Promise<string | undefined> {
    const selectors = [
      'span.dist-value',
      'span.entity-result__badge',
      'span.distance-badge',
      'div.entity-result__badge span'
    ];

    for (const selector of selectors) {
      try {
        const element = await card.findElement(By.css(selector));
        const degree = await element.getText();
        if (degree) {
          return degree.replace(/[·\s]+/g, ' ').trim();
        }
      } catch (error) {
        continue;
      }
    }

    return undefined;
  }

  private async extractProfileImage(card: WebElement): Promise<string | undefined> {
    const selectors = [
      'img.presence-entity__image',
      'img.ivm-view-attr__img--centered',
      'img.artdeco-entity-image',
      'img.EntityPhoto-circle-3'
    ];

    for (const selector of selectors) {
      try {
        const element = await card.findElement(By.css(selector));
        const src = await element.getAttribute('src');
        if (src) {
          return src;
        }
      } catch (error) {
        continue;
      }
    }

    return undefined;
  }

  private async checkOpenToWork(card: WebElement): Promise<boolean> {
    const selectors = [
      '.open-to-opportunities-badge',
      '.artdeco-pill.artdeco-pill--green',
      '.result-lockup__highlight-badge',
      'li.entity-result__highlight-pill'
    ];

    for (const selector of selectors) {
      try {
        const elements = await card.findElements(By.css(selector));
        if (elements.length > 0) {
          return true;
        }
      } catch (error) {
        continue;
      }
    }

    return false;
  }

  /**
   * Try to repair the search page when no results are found
   * @param driver WebDriver instance
   * @returns Boolean indicating if the repair was attempted
   */
  private async tryToRepairSearch(driver: WebDriver): Promise<boolean> {
    try {
      logger.info('Attempting to repair search page...');

      // First try refreshing the page
      await driver.navigate().refresh();
      await randomDelay(10000, 15000); // Wait longer for page to reload

      // Screenshot after refresh
      await this.saveSearchPageScreenshot(driver, 'after-repair-refresh');

      // Try a different approach - go back to the base search URL and retry
      const currentUrl = await driver.getCurrentUrl();
      const baseUrl = this.SEARCH_BASE_URL;

      if (currentUrl !== baseUrl) {
        logger.info('Navigating to base search URL...');
        await driver.get(baseUrl);
        await randomDelay(8000, 12000);

        // Try to find the search input and enter a basic search
        try {
          const searchInput = await driver.findElement(By.css('input[placeholder*="Search"]'));
          await searchInput.clear();
          await humanTypeText(searchInput, 'CEO');
          await searchInput.sendKeys(Key.ENTER);
          await randomDelay(10000, 15000);

          // Screenshot after search
          await this.saveSearchPageScreenshot(driver, 'after-repair-search');

          logger.info('Repair successful - basic search executed');
          return true;
        } catch (inputError) {
          logger.warn(`Could not find or use search input: ${inputError instanceof Error ? inputError.message : String(inputError)}`);
        }
      }

      // Try scrolling down to force content loading
      await driver.executeScript('window.scrollTo(0, document.body.scrollHeight * 0.5)');
      await randomDelay(3000, 5000);
      await driver.executeScript('window.scrollTo(0, document.body.scrollHeight)');
      await randomDelay(3000, 5000);

      // Screenshot after scrolling
      await this.saveSearchPageScreenshot(driver, 'after-repair-scroll');

      return true; // Indicate repair was attempted
    } catch (error) {
      logger.error(`Error during search repair: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * Save a screenshot of the search page for debugging
   * @param driver WebDriver instance
   * @param type Screenshot type label
   */
  private async saveSearchPageScreenshot(driver: WebDriver, type: string): Promise<void> {
    try {
      // Take a screenshot
      const screenshot = await driver.takeScreenshot();

      // Create directory if it doesn't exist
      const debugDir = path.join(process.cwd(), 'debug-screenshots');
      if (!fs.existsSync(debugDir)) {
        fs.mkdirSync(debugDir, { recursive: true });
      }

      // Generate filename with timestamp and type
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filePath = path.join(debugDir, `${type}-${timestamp}.png`);

      // Write the screenshot to a file
      fs.writeFileSync(filePath, Buffer.from(screenshot, 'base64'));

      logger.info(`Search page screenshot saved to: ${filePath}`);
    } catch (error) {
      logger.error(`Error saving search page screenshot: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Navigate to next page of search results
   * @param driver WebDriver instance
   * @returns Boolean indicating if next page exists and navigation successful
   */
  private async goToNextPage(driver: WebDriver): Promise<boolean> {
    try {
      logger.info('Checking for next page button...');

      // Take screenshot before pagination attempt
      await this.saveSearchPageScreenshot(driver, 'before-pagination');

      // Try multiple selectors for pagination
      const nextButtonSelectors = [
        'button[aria-label="Next"]',
        '.artdeco-pagination__button--next',
        '.search-results__pagination-next-button',
        'button.artdeco-pagination__button--next',
        '.search-results-container .artdeco-pagination__button--next'
      ];

      let nextButton = null;

      // Try to find the next button using different selectors
      for (const selector of nextButtonSelectors) {
        const buttons = await driver.findElements(By.css(selector));
        logger.debug(`Found ${buttons.length} next buttons with selector: ${selector}`);

        if (buttons.length > 0) {
          const isDisabled = await buttons[0].getAttribute('disabled');
          if (isDisabled === 'true') {
            logger.info('Next button found but is disabled');
            return false;
          }
          nextButton = buttons[0];
          logger.info(`Found next button with selector: ${selector}`);
          break;
        }
      }

      // If we didn't find a next button, look for pagination with page numbers
      if (!nextButton) {
        logger.debug('No next button found, checking for pagination numbers');

        // Get the current page number
        const currentPageElements = await driver.findElements(
          By.css('.artdeco-pagination__indicator--current')
        );

        if (currentPageElements.length > 0) {
          const currentPageNumber = parseInt(await currentPageElements[0].getText(), 10);
          logger.debug(`Current page number: ${currentPageNumber}`);

          // Try to find the next page number button
          const nextPageElements = await driver.findElements(
            By.css(`.artdeco-pagination__indicator button[aria-label="Page ${currentPageNumber + 1}"]`)
          );

          if (nextPageElements.length > 0) {
            nextButton = nextPageElements[0];
            logger.info(`Found next page button for page ${currentPageNumber + 1}`);
          } else {
            logger.info(`No button found for next page ${currentPageNumber + 1}`);
          }
        } else {
          logger.debug('Could not determine current page number');
        }
      }

      // If we still couldn't find a next button, try scrolling down and looking again
      if (!nextButton) {
        logger.debug('No pagination found, trying to scroll to bottom of page');
        await driver.executeScript('window.scrollTo(0, document.body.scrollHeight)');
        await randomDelay(2000, 3000);

        for (const selector of nextButtonSelectors) {
          const buttons = await driver.findElements(By.css(selector));
          if (buttons.length > 0 && await buttons[0].getAttribute('disabled') !== 'true') {
            nextButton = buttons[0];
            logger.info(`Found next button after scrolling with selector: ${selector}`);
            break;
          }
        }
      }

      if (!nextButton) {
        logger.info('No next page button found');
        return false;
      }

      // Try to click the next button
      try {
        await nextButton.click();
        logger.info('Clicked next page button');

        // Wait for new page to load
        await randomDelay(5000, 8000);

        // Take screenshot after pagination
        await this.saveSearchPageScreenshot(driver, 'after-pagination');

        // Check if page changed (we could check URL params or content change)
        // For now, just check for results container
        try {
          const resultsSelectors = [
            '.search-results-container',
            '.reusable-search__entity-results-list',
            '.scaffold-layout__list'
          ];

          for (const selector of resultsSelectors) {
            try {
              await driver.wait(until.elementLocated(By.css(selector)), 10000);
              logger.info(`Found results container after pagination with selector: ${selector}`);
              return true;
            } catch (e) {
              // Try next selector
            }
          }

          logger.warn('Could not find results container after pagination');
          return false;
        } catch (timeoutError) {
          logger.warn('Timeout waiting for results container after pagination');
          return false;
        }
      } catch (clickError) {
        logger.error(`Error clicking next button: ${clickError instanceof Error ? clickError.message : String(clickError)}`);
        return false;
      }
    } catch (error) {
      logger.warn(`Error navigating to next page: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * Process search results - check for duplicates and create leads
   * @param profiles Array of profile results from search
   * @param campaignId Optional campaign ID for lead tracking
   * @returns Array of unique profiles
   */
  private async processSearchResults(profiles: SearchResultProfile[], campaignId?: string): Promise<SearchResultProfile[]> {
    try {
      if (!campaignId || profiles.length === 0) {
        return profiles; // If no campaign ID provided or no profiles, return all profiles without processing
      }

      const uniqueProfiles: SearchResultProfile[] = [];
      const existingIds = new Set<string>();

      // First, collect all existing profileIds from the database in one query for efficiency
      if (profiles.length > 0) {
        const profileIds = profiles.map(profile => profile.profileId);

        // Check both PreviousLeads and regular Leads collections
        const existingLeads = await PreviousLeads.find({ value: { $in: profileIds } });
        const existingClientLeads = await Lead.find({ clientId: { $in: profileIds } });

        // Add them to our Set
        existingLeads.forEach(lead => existingIds.add(lead.value));
        existingClientLeads.forEach(lead => existingIds.add(lead.clientId));

        logger.info(`Found ${existingIds.size} existing leads out of ${profileIds.length} profiles`);
      }

      // Now process each profile
      for (const profile of profiles) {
        try {
          // Check if this profile has been processed before
          if (!existingIds.has(profile.profileId)) {
            // This is a new profile, add to PreviousLeads for de-duplication
            await PreviousLeads.create({ value: profile.profileId });

            // Create a more detailed Lead record with all available information
            if (campaignId) {
              await Lead.create({
                campaignId: new Types.ObjectId(campaignId),
                clientId: profile.profileId,
                profileUrl: profile.profileUrl,
                name: profile.name || '',
                headline: profile.headline || '',
                location: profile.location || '',
                currentCompany: profile.currentCompany || '',
                imageUrl: profile.imageUrl || '',
                isOpenToWork: profile.isOpenToWork || false,
                connectionDegree: profile.connectionDegree || '',
                status: 'NEW',
                isSearched: false,
                createdAt: new Date()
              });
            }

            // Add to unique profiles
            uniqueProfiles.push(profile);
            logger.debug(`Added new unique profile: ${profile.name} (${profile.profileId})`);
          } else {
            logger.debug(`Skipping duplicate profile: ${profile.name} (${profile.profileId})`);
          }
        } catch (error) {
          logger.error(`Error processing search result: ${error instanceof Error ? error.message : String(error)}`);
          // Continue with next profile even if there's an error
        }
      }

      logger.info(`Processed ${profiles.length} profiles, found ${uniqueProfiles.length} new unique profiles`);
      return uniqueProfiles;
    } catch (error) {
      logger.error(`Error in processSearchResults: ${error instanceof Error ? error.message : String(error)}`);
      // Return original profiles in case of error to ensure we don't lose data
      return profiles;
    }
  }

  /**
   * Handle security popups that might appear during search
   * @param driver WebDriver instance
   */
  private async handleSecurityPopups(driver: WebDriver): Promise<void> {
    try {
      logger.info('Checking for security popups...');

      // Common popup messages and buttons
      const popupSelectors = [
        // Security verification popups
        'button[data-control-name="security_verification_continue"]',
        'button[data-control-name="security_checkpoint_continue"]',

        // "Are you a robot?" popups
        'button.artdeco-button--primary',
        'button.primary-action-btn',
        'button.continue-btn',

        // "Not Now" buttons on various popups
        'button:contains("Not Now")',
        'button[aria-label="Dismiss"]',
        'button.artdeco-modal__dismiss',

        // "I'm not interested" buttons
        'button:contains("Not interested")',

        // Premium upsell popups
        'button.artdeco-button--muted',
        'button.artdeco-modal__confirm-dialog-btn',
        'button[data-control-name="overlay.close_conversation_window"]',

        // "Got it" buttons
        'button:contains("Got it")',
        'button.artdeco-button--primary:contains("Got it")'
      ];

      // Try each selector and click the button if found
      for (const selector of popupSelectors) {
        try {
          const buttons = await driver.findElements(By.css(selector));

          if (buttons.length > 0) {
            logger.info(`Found popup button with selector: ${selector}`);
            await buttons[0].click();
            logger.info('Clicked on popup button');
            // Wait for popup to disappear
            await randomDelay(2000, 3000);
            // Take a screenshot after handling popup
            await this.saveSearchPageScreenshot(driver, 'after-popup-dismiss');
            // Check if we have more popups
            continue;
          }
        } catch (error) {
          logger.debug(`Could not interact with selector ${selector}: ${error instanceof Error ? error.message : String(error)}`);
          // Continue with next selector
        }
      }

      // Also try to check for any iframes with verification content
      try {
        const securityFrames = await driver.findElements(By.css('iframe[title*="security"], iframe[name*="security"]'));

        if (securityFrames.length > 0) {
          logger.info('Found security iframe, attempting to interact with it');

          // Switch to the security frame
          await driver.switchTo().frame(securityFrames[0]);

          // Look for continue/verify buttons within the frame
          const frameButtons = await driver.findElements(
            By.css('button[type="submit"], button.primary-action-btn, button:contains("Continue")')
          );

          if (frameButtons.length > 0) {
            await frameButtons[0].click();
            logger.info('Clicked button within security frame');
          }

          // Switch back to main content
          await driver.switchTo().defaultContent();
          await randomDelay(3000, 5000);
        }
      } catch (frameError) {
        logger.debug(`Error handling security frames: ${frameError instanceof Error ? frameError.message : String(frameError)}`);
        // Make sure we're back to the main document
        await driver.switchTo().defaultContent();
      }

      logger.info('Finished checking for security popups');
    } catch (error) {
      logger.warn(`Error handling security popups: ${error instanceof Error ? error.message : String(error)}`);
      // Continue with search despite popup handling errors
    }
  }
}

export default LinkedInSearchService.getInstance();
