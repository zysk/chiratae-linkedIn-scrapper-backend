import { WebDriver, By, Key, until } from 'selenium-webdriver';
import { randomDelay, humanTypeText } from '../../utils/delay';
import logger from '../../utils/logger';
import { extractCompanyFromUrl, extractProfileId, tryParseCompanySize } from '../../utils/linkedin.utils';
import seleniumService from '../selenium/SeleniumService';

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

      // Build search URL with filters
      const searchUrl = this.buildSearchUrl(params);

      // Navigate to search URL
      await driver.get(searchUrl);
      await randomDelay(3000, 5000);

      // Check for additional filters that can't be applied via URL
      if (params.filters) {
        await this.applyAdvancedFilters(driver, params.filters);
      }

      // Extract results
      const maxResults = params.maxResults || 10;
      let results: SearchResultProfile[] = [];
      let currentPage = 1;
      let hasMorePages = true;

      // Extract results from current page
      while (results.length < maxResults && hasMorePages) {
        logger.info(`Extracting results from page ${currentPage}`);

        // Wait for results to load
        await driver.wait(until.elementLocated(By.css('.search-results-container')), 10000);
        await randomDelay(2000, 3000);

        // Extract profiles from current page
        const pageResults = await this.extractSearchResults(driver);
        results = [...results, ...pageResults];

        // Check if we need to go to next page
        if (results.length < maxResults) {
          hasMorePages = await this.goToNextPage(driver);
          if (hasMorePages) {
            currentPage++;
            await randomDelay(3000, 5000);
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
      throw new Error(`LinkedIn search failed: ${error instanceof Error ? error.message : String(error)}`);
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
      const profiles: SearchResultProfile[] = [];

      // Get all profile cards
      const profileCards = await driver.findElements(By.css('.entity-result'));

      // Extract data from each card
      for (const card of profileCards) {
        try {
          const profile: SearchResultProfile = {
            profileId: '',
            profileUrl: '',
            name: '',
          };

          // Get profile link and extract ID
          const profileLink = await card.findElements(By.css('a.app-aware-link[href*="/in/"]'));
          if (profileLink.length > 0) {
            const hrefAttr = await profileLink[0].getAttribute('href');
            profile.profileUrl = hrefAttr;
            profile.profileId = extractProfileId(hrefAttr);
          }

          // Get name
          const nameElements = await card.findElements(By.css('.entity-result__title-text'));
          if (nameElements.length > 0) {
            const nameSpan = await nameElements[0].findElement(By.css('span[aria-hidden="true"]'));
            profile.name = await nameSpan.getText();
          }

          // Get headline
          const headlineElements = await card.findElements(By.css('.entity-result__primary-subtitle'));
          if (headlineElements.length > 0) {
            profile.headline = await headlineElements[0].getText();
          }

          // Get location
          const locationElements = await card.findElements(By.css('.entity-result__secondary-subtitle'));
          if (locationElements.length > 0) {
            profile.location = await locationElements[0].getText();
          }

          // Get current company from headline or additional info
          if (profile.headline) {
            const companyMatch = profile.headline.match(/at\s+([^•]+)/i);
            if (companyMatch && companyMatch[1]) {
              profile.currentCompany = companyMatch[1].trim();
            }
          }

          // Get connection degree
          const degreeElements = await card.findElements(By.css('.entity-result__badge > span'));
          if (degreeElements.length > 0) {
            const degreeText = await degreeElements[0].getText();
            profile.connectionDegree = degreeText.replace('·', '').trim();
          }

          // Get profile image
          const imageElements = await card.findElements(By.css('img.presence-entity__image'));
          if (imageElements.length > 0) {
            profile.imageUrl = await imageElements[0].getAttribute('src');
          }

          // Check if open to work
          const openToWorkElements = await card.findElements(By.css('.open-to-opportunities-badge'));
          profile.isOpenToWork = openToWorkElements.length > 0;

          // Only add profiles with required data
          if (profile.profileId && profile.name) {
            profiles.push(profile);
          }
        } catch (cardError) {
          logger.warn(`Error extracting data from profile card: ${cardError instanceof Error ? cardError.message : String(cardError)}`);
          // Continue to next card
        }
      }

      return profiles;
    } catch (error) {
      logger.error(`Error extracting search results: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  /**
   * Navigate to next page of search results
   * @param driver WebDriver instance
   * @returns Boolean indicating if next page exists and navigation successful
   */
  private async goToNextPage(driver: WebDriver): Promise<boolean> {
    try {
      // Find the next button
      const nextButtons = await driver.findElements(By.css('button[aria-label="Next"]'));

      if (nextButtons.length === 0 || await nextButtons[0].getAttribute('disabled')) {
        return false;
      }

      // Click next button
      await nextButtons[0].click();

      // Wait for page to load
      await driver.wait(
        until.elementLocated(By.css('.search-results-container')),
        10000
      );

      return true;
    } catch (error) {
      logger.warn(`Error navigating to next page: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }
}

export default LinkedInSearchService.getInstance();
