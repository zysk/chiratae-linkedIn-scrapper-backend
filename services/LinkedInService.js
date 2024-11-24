import { By, Key, until } from "selenium-webdriver";
import { seleniumErrorHandler } from "../helpers/linkedin/seleniumErrorHandler";
import { randomIntFromInterval } from "../helpers/utils/utils";
import { searchLinkedInFn } from "../helpers/linkedin/SearchLinkedInFn";
import { getScheduledCampaignsForToday } from "../helpers/linkedin/ScheduledCampaigns";

export class LinkedInService {
    constructor(driver) {
        this.driver = driver;
    }

    async login(credentials) {
        try {
            await this.driver.get("https://www.linkedin.com/checkpoint/lg/sign-in-another-account");

            if (credentials.oneTimeLink) {
                await this.driver.get(credentials.oneTimeLink);
                return;
            }

            const username = await this.driver.wait(until.elementsLocated(By.id("username")));
            const password = await this.driver.wait(until.elementsLocated(By.id("password")));

            if (username && password) {
                await this.driver.findElement(By.id("username")).sendKeys(credentials.accountName);
                await this.driver.findElement(By.id("password"))
                    .sendKeys(Buffer.from(credentials.password, "base64").toString("ascii"));

                const submitButton = await this.driver.wait(
                    until.elementsLocated(By.xpath(`//button[@type="submit"]`))
                );
                if (submitButton) {
                    await this.driver.findElement(By.xpath(`//button[@type="submit"]`)).click();
                }
            }
        } catch (error) {
            throw new Error(`LinkedIn login failed: ${error.message}`);
        }
    }

    async searchPeople(searchQuery, filters) {
        try {
            await this.driver.get("https://www.linkedin.com");

            // Search input
            const searchInput = await this.driver.wait(
                until.elementLocated(By.xpath(`//input[@placeholder="Search"]`))
            );
            await searchInput.sendKeys(searchQuery, Key.ENTER);

            // Click People filter
            const peopleFilter = await this.driver.wait(
                until.elementLocated(By.xpath("//button[text()='People']"))
            );
            await peopleFilter.click();

            // Apply filters
            await this.applyFilters(filters);

            // Get results
            return await this.getSearchResults();
        } catch (error) {
            throw new Error(`LinkedIn search failed: ${error.message}`);
        }
    }

    async applyFilters(filters) {
        const { company, pastCompany, school } = filters;

        // Click All Filters button
        const allFiltersButton = await this.driver.wait(
            until.elementLocated(By.xpath(`//button[text()="All filters"]`))
        );
        await allFiltersButton.click();

        // Apply company filter
        if (company) {
            await this.applyFilter("Current company", company);
        }

        // Apply past company filter
        if (pastCompany) {
            await this.applyFilter("Past company", pastCompany);
        }

        // Apply school filter
        if (school) {
            await this.applyFilter("School", school);
        }

        // Click Show Results
        const showResults = await this.driver.wait(
            until.elementLocated(By.xpath(
                `//button[@data-test-reusables-filters-modal-show-results-button="true"]`
            ))
        );
        await showResults.click();
    }

    async getSearchResults() {
        const results = [];
        let hasNextPage = true;

        while (hasNextPage) {
            // Scroll to load all results
            await this.driver.executeScript(`window.scrollTo(0, 4500)`);
            await this.driver.sleep(randomIntFromInterval(1000, 2000));

            // Get results on current page
            const resultElements = await this.driver.wait(
                until.elementsLocated(By.xpath(
                    `//ul[@class="reusable-search__entity-result-list list-style-none"]/li`
                ))
            );

            // Extract data from each result
            for (const element of resultElements) {
                const result = await this.extractResultData(element);
                if (result) {
                    results.push(result);
                }
            }

            // Check for next page
            hasNextPage = await this.goToNextPage();
        }

        return results;
    }

    // ... Additional helper methods
}