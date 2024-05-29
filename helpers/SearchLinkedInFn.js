import { By, Key, until } from "selenium-webdriver";
import Campaign from "../models/Campaign.model";
import Lead from "../models/leads.model";
import User from "../models/user.model";
// const chrome = require('/usr/bin/chromedriver');  ///////chrome for server
// const chrome = require('./chromedriver').path;
import { driver as maindriver, redisClient } from "../app";
import { generalModelStatuses, rolesObj } from "../helpers/Constants";
import { seleniumErrorHandler } from "../helpers/seleniumErrorHandler";
import PreviousLeads from "../models/previousLeads.model";
import UserLogs from "../models/userLogs.model";
import { randomIntFromInterval } from "./utils";
import { checkLinkedInLoginFunc } from "../controllers/Campaign.controller";
import { sendMail } from "../helpers/nodeMailer";
import LinkedInAccountsModel from "../models/LinkedInAccounts.model";

export const searchLinkedInFn = async (redisClientParam) => {
    try {
        await redisClientParam.set("isFree", "false");

        const driver = await maindriver;

        let loggedIn = await checkLinkedInLoginFunc();
        if (!loggedIn) {
            let allEmails = await LinkedInAccountsModel.find().exec();
            let emails = allEmails.map((element) => element.name);
            await sendMail(emails);
            await redisClient.set("isFree", "true");
            return false;
        }

        let campaignArr = await Campaign.find({ status: generalModelStatuses.CREATED, isSearched: false, processing: false }).lean().exec();

        let totalResults = "";
        if (!campaignArr.length) {
            return true;
        }

        let resultsArr = [];

        for (let i = 0; i < campaignArr.length; i++) {
            try {
                let campaignObj = campaignArr[i];

                let page = await driver.get("https://www.linkedin.com");

                let searchInput = await driver.wait(until.elementLocated(By.xpath(`//input[@class="search-global-typeahead__input"]`)));

                if (searchInput) {
                    // ! searching for search input on linkedin and entering the query sent by user and submiting the input

                    await driver.findElement(By.xpath(`//input[@class="search-global-typeahead__input"]`)).sendKeys(`${campaignObj.searchQuery}`, Key.ENTER);

                    // ? search input filled , now looking for people filter on linkedin

                    let filterClick = await driver.wait(until.elementLocated(By.xpath("//button[text()='People']")));
                    if (filterClick) {
                        // ? clicking on people filter
                        await driver.findElement(By.xpath("//button[text()='People']")).click();

                        try {
                            let filterResultsVisibleClick = await driver.wait(until.elementLocated(By.xpath(`//div[@class="search-results-container"]`)), 5000);
                            if (filterResultsVisibleClick) {
                                // ? scrolling the page to bottom because linked in does not load the whole page until its scrolled
                                await driver.executeScript(`window.scrollTo(0, 4500)`);
                                // ? locating all filters button
                                try {
                                    let allFiltersClick = await driver.wait(until.elementLocated(By.xpath(`// div[@class="relative mr2"]//button[text() = "All filters"]`)));
                                    if (allFiltersClick) {
                                        // ? clicking on all filters button
                                        await driver.findElement(By.xpath(`// div[@class="relative mr2"]//button[text() = "All filters"]`)).click();

                                        // ! locating company filter
                                        if (campaignObj.company && campaignObj.company != "") {
                                            let filtersArr = campaignObj.company.split(",");
                                            for (const rl of filtersArr) {
                                                // ? locating company filter
                                                let companyButton = await driver.wait(until.elementLocated(By.xpath(`//ul//li//fieldset//h3[text()="Current company"]/following-sibling::div//ul//li[last()]//button`)));
                                                if (companyButton) {
                                                    // ? waiting for the elements to load
                                                    await driver.sleep(randomIntFromInterval(1000, 2000));
                                                    // ? clicking on the company button to reveal text input
                                                    await driver.findElement(By.xpath(`//ul//li//fieldset//h3[text()="Current company"]/following-sibling::div//ul//li[last()]//button`)).click();
                                                    // ? clicking on the text input to get it in focus
                                                    await driver
                                                        .findElement(
                                                            By.xpath(`//ul//li//fieldset//h3[text()="Current company"]/following-sibling::div//ul//li[last()]//div[@class="search-reusables__filter-new-value-typeahead"]//div//input`)
                                                        )
                                                        .click();
                                                    // ? entering values in the text input
                                                    await driver
                                                        .findElement(
                                                            By.xpath(`//ul//li//fieldset//h3[text()="Current company"]/following-sibling::div//ul//li[last()]//div[@class="search-reusables__filter-new-value-typeahead"]//div//input`)
                                                        )
                                                        .sendKeys(rl);
                                                    // ? waiting for the elements to load
                                                    await driver.sleep(randomIntFromInterval(1000, 2000));
                                                    // ? clicking on the text input to get it in focus
                                                    await driver
                                                        .findElement(
                                                            By.xpath(`//ul//li//fieldset//h3[text()="Current company"]/following-sibling::div//ul//li[last()]//div[@class="search-reusables__filter-new-value-typeahead"]//div//input`)
                                                        )
                                                        .click();
                                                    // ? pressing down key to highlight the first result
                                                    await driver
                                                        .findElement(
                                                            By.xpath(`//ul//li//fieldset//h3[text()="Current company"]/following-sibling::div//ul//li[last()]//div[@class="search-reusables__filter-new-value-typeahead"]//div//input`)
                                                        )
                                                        .sendKeys(Key.ARROW_DOWN);
                                                    // ? pressing down enter to select the first result
                                                    await driver
                                                        .findElement(
                                                            By.xpath(`//ul//li//fieldset//h3[text()="Current company"]/following-sibling::div//ul//li[last()]//div[@class="search-reusables__filter-new-value-typeahead"]//div//input`)
                                                        )
                                                        .sendKeys(Key.ENTER);
                                                }
                                            }
                                        }
                                        // ! locating past company filter
                                        if (campaignObj.pastCompany && campaignObj.pastCompany != "") {
                                            let filtersArr = campaignObj.pastCompany.split(",");
                                            for (const rl of filtersArr) {
                                                // ? locating past company filter
                                                let companyButton = await driver.wait(until.elementLocated(By.xpath(`//ul//li//fieldset//h3[text()="Past company"]/following-sibling::div//ul//li[last()]//button`)));
                                                if (companyButton) {
                                                    // ? waiting for the elements to load
                                                    await driver.sleep(randomIntFromInterval(1000, 2000));
                                                    // ? clicking on the company button to reveal text input
                                                    await driver.findElement(By.xpath(`//ul//li//fieldset//h3[text()="Past company"]/following-sibling::div//ul//li[last()]//button`)).click();
                                                    // ? clicking on the text input to get it in focus
                                                    await driver
                                                        .findElement(By.xpath(`//ul//li//fieldset//h3[text()="Past company"]/following-sibling::div//ul//li[last()]//div[@class="search-reusables__filter-new-value-typeahead"]//div//input`))
                                                        .click();
                                                    // ? entering values in the text input
                                                    await driver
                                                        .findElement(By.xpath(`//ul//li//fieldset//h3[text()="Past company"]/following-sibling::div//ul//li[last()]//div[@class="search-reusables__filter-new-value-typeahead"]//div//input`))
                                                        .sendKeys(rl);
                                                    // ? waiting for the elements to load
                                                    await driver.sleep(randomIntFromInterval(1000, 2000));
                                                    // ? clicking on the text input to get it in focus
                                                    await driver
                                                        .findElement(By.xpath(`//ul//li//fieldset//h3[text()="Past company"]/following-sibling::div//ul//li[last()]//div[@class="search-reusables__filter-new-value-typeahead"]//div//input`))
                                                        .click();
                                                    // ? pressing down key to highlight the first result
                                                    await driver
                                                        .findElement(By.xpath(`//ul//li//fieldset//h3[text()="Past company"]/following-sibling::div//ul//li[last()]//div[@class="search-reusables__filter-new-value-typeahead"]//div//input`))
                                                        .sendKeys(Key.ARROW_DOWN);
                                                    // ? pressing down enter to select the first result
                                                    await driver
                                                        .findElement(By.xpath(`//ul//li//fieldset//h3[text()="Past company"]/following-sibling::div//ul//li[last()]//div[@class="search-reusables__filter-new-value-typeahead"]//div//input`))
                                                        .sendKeys(Key.ENTER);
                                                }
                                            }
                                        }
                                        // ! locating school filter
                                        if (campaignObj.school && campaignObj.school != "") {
                                            let filtersArr = campaignObj.school.split(",");
                                            for (const rl of filtersArr) {
                                                let SchoolButton = await driver.wait(until.elementLocated(By.xpath(`//ul//li//fieldset//h3[text()="School"]/following-sibling::div//ul//li[last()]//button`)));
                                                if (SchoolButton) {
                                                    // ? waiting for the elements to load
                                                    await driver.sleep(randomIntFromInterval(1000, 2000));
                                                    // ? clicking on the school button to reveal text input
                                                    await driver.findElement(By.xpath(`//ul//li//fieldset//h3[text()="School"]/following-sibling::div//ul//li[last()]//button`)).click();
                                                    // ? clicking on the text input to get it in focus
                                                    await driver
                                                        .findElement(By.xpath(`//ul//li//fieldset//h3[text()="School"]/following-sibling::div//ul//li[last()]//div[@class="search-reusables__filter-new-value-typeahead"]//div//input`))
                                                        .click();
                                                    // ? entering values in the text input
                                                    await driver
                                                        .findElement(By.xpath(`//ul//li//fieldset//h3[text()="School"]/following-sibling::div//ul//li[last()]//div[@class="search-reusables__filter-new-value-typeahead"]//div//input`))
                                                        .sendKeys(rl);
                                                    // ? waiting for the elements to load
                                                    await driver.sleep(randomIntFromInterval(1000, 2000));
                                                    // ? clicking on the text input to get it in focus
                                                    await driver
                                                        .findElement(By.xpath(`//ul//li//fieldset//h3[text()="School"]/following-sibling::div//ul//li[last()]//div[@class="search-reusables__filter-new-value-typeahead"]//div//input`))
                                                        .click();
                                                    // ? pressing down key to highlight the first result
                                                    await driver
                                                        .findElement(By.xpath(`//ul//li//fieldset//h3[text()="School"]/following-sibling::div//ul//li[last()]//div[@class="search-reusables__filter-new-value-typeahead"]//div//input`))
                                                        .sendKeys(Key.ARROW_DOWN);
                                                    // ? pressing down enter to select the first result
                                                    await driver
                                                        .findElement(By.xpath(`//ul//li//fieldset//h3[text()="School"]/following-sibling::div//ul//li[last()]//div[@class="search-reusables__filter-new-value-typeahead"]//div//input`))
                                                        .sendKeys(Key.ENTER);
                                                }
                                            }
                                        }
                                        // ? waiting for the elements to load
                                        await driver.sleep(randomIntFromInterval(1000, 2000));
                                        // ? locating show results button
                                        let showResults = await driver.wait(until.elementLocated(By.xpath(`//button[@data-test-reusables-filters-modal-show-results-button="true" and @aria-label="Apply current filters to show results"]`)));
                                        if (showResults) {
                                            // ? clicking on show results button
                                            await driver.findElement(By.xpath(`//button[@data-test-reusables-filters-modal-show-results-button="true" and @aria-label="Apply current filters to show results"]`)).click();
                                        }
                                    }
                                } catch (err) {
                                    seleniumErrorHandler();
                                }

                                // ? waiting for the elements to load
                                await driver.sleep(randomIntFromInterval(1000, 2000));
                                // ? locating total results div

                                // ? scrolling the page to bottom because linked in does not load the whole page until its scrolled
                                await driver.executeScript(`window.scrollTo(0, 4500)`);

                                // ? getting total results
                                try {
                                    totalResults = await driver.findElement(By.xpath(`//div[@class="search-results-container"]/div/h2/div`)).getText();
                                    // console.log("TOTAL RESULTS", totalResults)

                                    await Campaign.findByIdAndUpdate(campaignObj._id, { totalResults: totalResults });
                                } catch (error) {
                                    console.error(error);
                                    seleniumErrorHandler();
                                }

                                // console.log("SCROLL TO BOTTOM THE FIRST");
                                // ? locating next button
                                try {
                                    let nextbutton = await driver.wait(until.elementsLocated(By.xpath(`//button[@aria-label="Next"]//span[text()='Next']`)), 5000);
                                    // console.log("nextbutton")
                                    if (nextbutton) {
                                        // ? finding if next button is enabled or not
                                        let nextbuttonText = await driver.findElement(By.xpath(`//button[@aria-label="Next"]//span[text()='Next']`)).isEnabled();
                                        while (nextbuttonText) {
                                            try {
                                                // console.log("FILTER 3")
                                                let resultText = await driver.wait(until.elementLocated(By.xpath(`//div[@class="search-results-container"]/div/h2/div`)), 5000);
                                                if (resultText) {
                                                    // ? getting value of total results
                                                    // console.log(">>>>>>>>>", resultText);
                                                }
                                            } catch (error) {
                                                console.error(error);
                                            }

                                            // ? scrolling the page to bottom because linked in does not load the whole page until its scrolled
                                            await driver.executeScript(`window.scrollTo(0, 4500)`);

                                            // console.log("SCROLL TO BOTTOM THE ALT>>>>>>>>>>>>>>>>>>>>>>>")
                                            // ? waiting for the elements to load
                                            await driver.sleep(randomIntFromInterval(1000, 2000));
                                            // ? locating results div
                                            try {
                                                let resultElement = await driver.wait(
                                                    until.elementsLocated(By.xpath(`//ul[@class="reusable-search__entity-result-list list-style-none"]/li[@class="reusable-search__result-container"]`)),
                                                    5000
                                                );
                                                if (resultElement) {
                                                    // console.log(resultElement.length, "resultElement.length");
                                                    // ? looping through the results
                                                    for (let i = 0; i < resultElement.length; i++) {
                                                        let obj = {};
                                                        // ? locating name of the users
                                                        let name = await driver
                                                            .findElement(
                                                                By.xpath(
                                                                    `//ul[@class="reusable-search__entity-result-list list-style-none"]/li[@class="reusable-search__result-container"][${
                                                                        i + 1
                                                                    }]/div/div/div/div[2]/div/div/div[@class="display-flex"]/span/span/a/span/span[@aria-hidden="true"]`
                                                                )
                                                            )
                                                            .getText();
                                                        if (name) {
                                                            obj.name = name?.split("\n")[0];
                                                        }
                                                        // ? locating profile link of the users
                                                        let linkValue = await driver
                                                            .findElement(
                                                                By.xpath(
                                                                    `//ul[@class="reusable-search__entity-result-list list-style-none"]/li[@class="reusable-search__result-container"][${
                                                                        i + 1
                                                                    }]/div/div/div/div[2]/div/div/div[@class="display-flex"]/span/span/a`
                                                                )
                                                            )
                                                            .getAttribute("href");
                                                        if (linkValue) {
                                                            obj.link = linkValue;
                                                        }
                                                        resultsArr.push(obj);
                                                    }
                                                }
                                            } catch (err) {
                                                seleniumErrorHandler();
                                            }
                                            // ? scrolling the page to bottom because linked in does not load the whole page until its scrolled
                                            await driver.executeScript(`window.scrollTo(0, 4500)`);

                                            // ? waiting for the elements to load
                                            await driver.sleep(randomIntFromInterval(1000, 2000));
                                            // ? finding if next button is visible or not
                                            try {
                                                let nextbuttonIsValid = await driver.wait(until.elementIsVisible(driver.findElement(By.xpath(`//button[@aria-label="Next"]//span[text()='Next']`))), 1000);
                                                if (nextbuttonIsValid) {
                                                    // ? finding if next button is enabled or not
                                                    nextbuttonText = await driver.findElement(By.xpath(`//button[@aria-label="Next"]`)).isEnabled();
                                                    if (nextbuttonText) {
                                                        // ? locating next button
                                                        let nextButtonValue1 = await driver.wait(until.elementLocated(By.xpath(`//button[@aria-label="Next"]`)));
                                                        if (nextButtonValue1) {
                                                            // ? clicking on next button
                                                            await driver.findElement(By.xpath(`//button[@aria-label="Next"]`))?.click();
                                                        }
                                                    } else {
                                                        break;
                                                    }
                                                } else {
                                                    break;
                                                }
                                            } catch (err) {
                                                seleniumErrorHandler();
                                            }
                                        }
                                    }
                                } catch (err) {
                                    // ? scrolling the page to bottom because linked in does not load the whole page until its scrolled
                                    await driver.executeScript(`window.scrollTo(0, 4500)`);

                                    // ? waiting for the elements to load
                                    await driver.sleep(randomIntFromInterval(1000, 2000));

                                    try {
                                        let resultText = await driver.wait(until.elementLocated(By.xpath(`//div[@class="search-results-container"]/div/h2/div`)), 5000);
                                        if (resultText) {
                                            // ? getting value of total results
                                            totalResults = await driver.findElement(By.xpath(`//div[@class="search-results-container"]/div/h2/div`)).getText();
                                            // console.log("TOTAL RESULTS", totalResults)
                                        }
                                    } catch (error) {
                                        console.error(error);
                                        seleniumErrorHandler();
                                    }
                                    // ? locating results div
                                    try {
                                        let resultElement = await driver.wait(until.elementsLocated(By.xpath(`//ul[@class="reusable-search__entity-result-list list-style-none"]/li[@class="reusable-search__result-container"]`)), 5000);
                                        // console.log("runnnnn till herereeeeeeeeeeeeerererer");
                                        if (resultElement) {
                                            // console.log(">>>>>>>>>>>>>>>>> resultElement", resultElement.length);
                                            // ? looping through the results
                                            for (let i = 0; i < resultElement.length; i++) {
                                                let obj = {};
                                                // ? locating name of the users
                                                let name = await driver
                                                    .findElement(
                                                        By.xpath(
                                                            `//ul[@class="reusable-search__entity-result-list list-style-none"]/li[@class="reusable-search__result-container"][${
                                                                i + 1
                                                            }]/div/div/div/div[2]/div/div/div[@class="display-flex"]/span/span/a/span/span[@aria-hidden="true"]`
                                                        )
                                                    )
                                                    .getText();
                                                if (name) {
                                                    obj.name = name?.split("\n")[0];
                                                }
                                                // ? locating profile link of the users
                                                let linkValue = await driver
                                                    .findElement(
                                                        By.xpath(
                                                            `//ul[@class="reusable-search__entity-result-list list-style-none"]/li[@class="reusable-search__result-container"][${
                                                                i + 1
                                                            }]/div/div/div/div[2]/div/div/div[@class="display-flex"]/span/span/a`
                                                        )
                                                    )
                                                    .getAttribute("href");
                                                if (linkValue) {
                                                    obj.link = linkValue;
                                                }
                                                resultsArr.push(obj);
                                            }
                                        }
                                    } catch (err) {
                                        seleniumErrorHandler();
                                    }
                                }
                            }
                        } catch (err) {
                            seleniumErrorHandler();
                        }
                    }
                }

                // // console.log(JSON.stringify(resultsArr, null, 2), resultsArr, "resultsArr",)
                let lengthOfArray = resultsArr.filter((el) => el.link && el.link != "").length;
				// console.log(`resultsArr 1111====>>>> ${resultsArr.length}`);
				// console.log(`lengthOfArray 1111====>>>> ${lengthOfArray}`);

                // /////not for now
                for (let j = 0; j < lengthOfArray; j++) {
                    try {
                        //         // // console.log("LinkedIn", j + 1, lengthOfArray)
                        //         await driver.get(`${resultsArr[j].link}`);
                        //         await driver.sleep(2000)

                        //         let currentUrl = await driver.getCurrentUrl()
                        //         try {

                        //             let currentPosition = await driver.wait(until.elementLocated(By.xpath(`//div[@class="text-body-medium break-words"]`)), 5000)
                        //             if (currentPosition) {
                        //                 let currentPositionValue = await driver.findElement(By.xpath(`//div[@class="text-body-medium break-words"]`)).getText()
                        //                 resultsArr[j].currentPosition = currentPositionValue
                        //             }
                        //         }
                        //         catch (err) {
                        //             seleniumErrorHandler()
                        //         }

                        //         try {
                        //             let location = await driver.wait(until.elementLocated(By.xpath(`//div[@class="pv-text-details__left-panel mt2"]//span`)), 5000)
                        //             if (location) {
                        //                 let locationValue = await driver.findElement(By.xpath(`//div[@class="pv-text-details__left-panel mt2"]//span`)).getText()
                        //                 resultsArr[j].location = locationValue
                        //             }
                        //         }
                        //         catch (err) {
                        //             seleniumErrorHandler()
                        //         }

                        //         try {
                        //             let contactInfoLinkExists = await driver.wait(until.elementLocated(By.xpath(`//a[text()="Contact info"]`)), 5000)
                        //             if (contactInfoLinkExists) {
                        //                 await driver.get(`${currentUrl}/overlay/contact-info/`);
                        //                 await driver.sleep(10000)
                        //                 let contactInfoArr = [];

                        //                 ////// //h3
                        //                 try {
                        //                     let contactInfoElementsExists = await driver.wait(until.elementLocated(By.xpath(`//section[@class="pv-profile-section pv-contact-info artdeco-container-card"]//div[@class="pv-profile-section__section-info section-info"]//section`)), 5000)
                        //                     if (contactInfoElementsExists) {
                        //                         let contactInfoElements = await driver.findElements(By.xpath(`//section[@class="pv-profile-section pv-contact-info artdeco-container-card"]//div[@class="pv-profile-section__section-info section-info"]//section`))
                        //                         await driver.sleep(2000)

                        //                         // // console.log(contactInfoElements, contactInfoElements.length, "contactInfoElements")
                        //                         let obj = {}
                        //                         for (let q = 0; q < contactInfoElements.length; q++) {

                        //                             obj = {
                        //                                 heading: "",
                        //                                 dataArr: []
                        //                             }

                        //                             // // console.log(q, "k")
                        //                             try {
                        //                                 let contactInfoHeading = await driver.findElement(By.xpath(`(//section[@class="pv-profile-section pv-contact-info artdeco-container-card"]//div[@class="pv-profile-section__section-info section-info"]//section//h3)[${q + 1}]`), 5000)
                        //                                 if (contactInfoHeading) {
                        //                                     obj.heading = await driver.findElement(By.xpath(`(//section[@class="pv-profile-section pv-contact-info artdeco-container-card"]//div[@class="pv-profile-section__section-info section-info"]//section//h3)[${q + 1}]`)).getText()
                        //                                     // // console.log(obj.heading, "heading")
                        //                                 }
                        //                             }
                        //                             catch (err) {
                        //                                 console.error(err, "could not find contact info h3")
                        //                                 seleniumErrorHandler()
                        //                             }

                        //                             try {
                        //                                 let contactInfoElementsExists = await driver.wait(until.elementsLocated(By.xpath(`(//section[@class="pv-profile-section pv-contact-info artdeco-container-card"]//div[@class="pv-profile-section__section-info section-info"]//section)[${q + 1}]//a`)), 5000)
                        //                                 if (contactInfoElementsExists) {
                        //                                     let contactInfourlList = await driver.findElements(By.xpath(`(//section[@class="pv-profile-section pv-contact-info artdeco-container-card"]//div[@class="pv-profile-section__section-info section-info"]//section)[${q + 1}]//a`))
                        //                                     if (contactInfourlList && contactInfourlList.length > 0) {
                        //                                         for (let p = 0; p < contactInfourlList.length; p++) {
                        //                                             let contactLinkElement = await driver.findElement(By.xpath(`((//section[@class="pv-profile-section pv-contact-info artdeco-container-card"]//div[@class="pv-profile-section__section-info section-info"]//section)[${q + 1}]//a)[${p + 1}]`)).getText()

                        //                                             // // console.log(contactLinkElement, "contactLinkElement")

                        //                                             obj.dataArr.push(contactLinkElement);
                        //                                         }
                        //                                     }
                        //                                 }
                        //                             }
                        //                             catch (err) {
                        //                                 // // console.log("inside, catch", err)
                        //                                 try {
                        //                                     let contactInfoListExists = await driver.wait(until.elementsLocated(By.xpath(`((//section[@class="pv-profile-section pv-contact-info artdeco-container-card"]//div[@class="pv-profile-section__section-info section-info"]//section)[${q + 1}]/ul/li)`)), 5000)
                        //                                     if (contactInfoListExists) {

                        //                                         let contactInfoList = await driver.findElements(By.xpath(`((//section[@class="pv-profile-section pv-contact-info artdeco-container-card"]//div[@class="pv-profile-section__section-info section-info"]//section)[${q + 1}]/ul/li)`))
                        //                                         if (contactInfoList) {
                        //                                             for (let p = 0; p < contactInfoList.length; p++) {
                        //                                                 let contactInfoListValue = await driver.findElement(By.xpath(`(((//section[@class="pv-profile-section pv-contact-info artdeco-container-card"]//div[@class="pv-profile-section__section-info section-info"]//section)[${q + 1}]/ul/li)[${p + 1}]/span)[1]`)).getText()
                        //                                                 // // console.log(contactInfoListValue, "contactInfoListValue")

                        //                                                 obj.dataArr.push(contactInfoListValue);
                        //                                             }
                        //                                         }
                        //                                         else {
                        //                                             console.error("Not found link")
                        //                                         }
                        //                                     }
                        //                                 }
                        //                                 catch (err) {
                        //                                     let contactInfoList = await driver.findElements(By.xpath(`((//section[@class="pv-profile-section pv-contact-info artdeco-container-card"]//div[@class="pv-profile-section__section-info section-info"]//section)[${q + 1}])//div/span`))
                        //                                     if (contactInfoList) {
                        //                                         let contactInfoListValue = await driver.findElement(By.xpath(`((//section[@class="pv-profile-section pv-contact-info artdeco-container-card"]//div[@class="pv-profile-section__section-info section-info"]//section)[${q + 1}])//div/span`)).getText()

                        //                                         obj.dataArr.push(contactInfoListValue);
                        //                                     }
                        //                                     // // console.log(err)
                        //                                 }

                        //                                 console.error(err, "could not find contact info h3")
                        //                             }
                        //                             // // console.log(obj, "obj")
                        //                             contactInfoArr.push(obj)
                        //                         }

                        //                     }
                        //                     else {
                        //                         // // console.log("not found")
                        //                     }

                        //                 }
                        //                 catch (err) {
                        //                     console.error(err, "could not find contact info section tags")
                        //                     seleniumErrorHandler()
                        //                 }
                        //                 // // console.log(contactInfoArr, "contactInfoArr")
                        //                 resultsArr[j].contactInfoArr = contactInfoArr
                        //             }

                        //         }
                        //         catch (err) {
                        //             console.error(err)
                        //             seleniumErrorHandler()
                        //         }

                        //         try {

                        //             let tempEducationArr = []
                        //             await driver.get(`${currentUrl}/details/education/`);
                        //             await driver.sleep(10000)

                        //             try {
                        //                 let tempEducationArrExists = await driver.wait(until.elementLocated(By.xpath(`(//ul/li[@class="pvs-list__paged-list-item artdeco-list__item pvs-list__item--line-separated "])`)), 5000)
                        //                 if (tempEducationArrExists) {
                        //                     let internalEducationarr = await driver.findElements(By.xpath(`(//ul/li[@class="pvs-list__paged-list-item artdeco-list__item pvs-list__item--line-separated "])`))

                        //                     // // console.log(internalEducationarr, "internnaleducation arr")
                        //                     for (let l = 0; l < internalEducationarr.length; l++) {

                        //                         let schoolName = ""
                        //                         let schoolDetail = ""
                        //                         let year = ""
                        //                         try {
                        //                             schoolName = await driver.findElement(By.xpath(`(//ul/li[@class="pvs-list__paged-list-item artdeco-list__item pvs-list__item--line-separated "])[${l + 1}]/div/div//div[@class="display-flex flex-row justify-space-between"]/a/div//span[@aria-hidden="true"]`)).getText()
                        //                         }
                        //                         catch (err) {
                        //                             console.error(err)
                        //                         }
                        //                         try {
                        //                             schoolDetail = await driver.findElement(By.xpath(`(//ul/li[@class="pvs-list__paged-list-item artdeco-list__item pvs-list__item--line-separated "])[${l + 1}]/div/div//div[@class="display-flex flex-row justify-space-between"]/a//span[@class="t-14 t-normal"]//span[@aria-hidden="true"]`)).getText()
                        //                         }
                        //                         catch (err) {
                        //                             console.error(err)
                        //                         }
                        //                         try {
                        //                             year = await driver.findElement(By.xpath(`(//ul/li[@class="pvs-list__paged-list-item artdeco-list__item pvs-list__item--line-separated "])[${l + 1}]/div/div//div[@class="display-flex flex-row justify-space-between"]/a//span[@class="t-14 t-normal t-black--light"]//span[@aria-hidden="true"]`)).getText()
                        //                         }
                        //                         catch (err) {
                        //                             console.error(err)
                        //                         }

                        //                         let obj = {
                        //                             schoolName,
                        //                             schoolDetail,
                        //                             year,
                        //                         }
                        //                         // // console.log(obj, "education Obj")
                        //                         tempEducationArr.push(obj)
                        //                     }

                        //                 }

                        //             }
                        //             catch (err) {
                        //                 console.error(err)
                        //                 seleniumErrorHandler()
                        //             }

                        //             resultsArr[j].educationArr = tempEducationArr
                        //             // // console.log(tempEducationArr, "tempEducationArr")

                        //         }
                        //         catch (err) {
                        //             console.error(err)
                        //             seleniumErrorHandler()
                        //         }
                        //         // // console.log("getExperience", `${resultsArr[j].link}/details/experience/`)
                        //         await driver.get(`${currentUrl}/details/experience/`);
                        //         await driver.sleep(10000)
                        //         try {
                        //             let experienceFound = await driver.wait(until.elementLocated(By.xpath(`//main//section/div[@class="pvs-list__container"]/div/div/ul[@class="pvs-list "]/li/div/div/div[@class="display-flex flex-column full-width align-self-center"]`)), 5000)

                        //             if (experienceFound) {
                        //                 let experienceArr = await driver.findElements(By.xpath(`//main//section/div[@class="pvs-list__container"]/div/div/ul[@class="pvs-list "]/li/div/div/div[@class="display-flex flex-column full-width align-self-center"]`))
                        //                 // // console.log(experienceArr, "experienceArr", experienceArr.length)
                        //                 let experienceValueArr = []

                        //                 if (experienceArr && experienceArr.length > 0) {
                        //                     for (let k = 0; k < experienceArr.length; k++) {
                        //                         let companyvalue = ""
                        //                         let value = ""
                        //                         let year = ""
                        //                         try {
                        //                             let checkElementHasAnchorTag = await driver.findElement(By.xpath(`(//main//section/div[@class="pvs-list__container"]/div/div/ul[@class="pvs-list "]/li//div/div/div[@class="display-flex flex-column full-width align-self-center"])[${k + 1}]/div[@class="display-flex flex-row justify-space-between"]/a`), 5000);
                        //                             if (checkElementHasAnchorTag) {
                        //                                 // // console.log("inside if")
                        //                                 try {
                        //                                     companyvalue = await driver.findElement(By.xpath(`(//main//section/div[@class="pvs-list__container"]/div/div/ul[@class="pvs-list "]/li/div/div/div[@class="display-flex flex-column full-width align-self-center"])[${k + 1}]/div[@class="display-flex flex-row justify-space-between"]/a/div//span[@aria-hidden="true"]`)).getText();
                        //                                 }
                        //                                 catch (error) {
                        //                                     try {
                        //                                         companyvalue = await driver.findElement(By.xpath(`(//main//section/div[@class="pvs-list__container"]/div/div/ul[@class="pvs-list "]/li/div/div/div[@class="display-flex flex-column full-width align-self-center"])[${k + 1}]/div[@class="display-flex flex-row justify-space-between"]/div/div/span/span[@aria-hidden="true"]`)).getText();
                        //                                     }
                        //                                     catch (error) {
                        //                                         console.error(error)
                        //                                     }
                        //                                     console.error(error)
                        //                                 }
                        //                                 try {
                        //                                     value = await driver.findElement(By.xpath(`(//main//section/div[@class="pvs-list__container"]/div/div/ul[@class="pvs-list "]/li/div/div/div[@class="display-flex flex-column full-width align-self-center"])[${k + 1}]/div[@class="display-flex flex-row justify-space-between"]/a/div/span[@class="t-14 t-normal"]/span[@aria-hidden="true"]`)).getText();
                        //                                 }
                        //                                 catch (error) {
                        //                                     value = await driver.findElement(By.xpath(`((//main//section/div[@class="pvs-list__container"]/div/div/ul[@class="pvs-list "]/li/div/div/div[@class="display-flex flex-column full-width align-self-center"])[${k + 1}]/div[@class="display-flex flex-row justify-space-between"]/a/span/span[@aria-hidden="true"])[1]`)).getText();
                        //                                     console.error(error)
                        //                                 }
                        //                                 try {
                        //                                     year = await driver.findElement(By.xpath(`((//main//section/div[@class="pvs-list__container"]/div/div/ul[@class="pvs-list "]/li/div/div/div[@class="display-flex flex-column full-width align-self-center"])[${k + 1}]/div[@class="display-flex flex-row justify-space-between"]/a/div/span[@class="t-14 t-normal t-black--light"]/span[@aria-hidden="true"])[1]`)).getText();
                        //                                 } catch (error) {
                        //                                     try {
                        //                                         year = await driver.findElement(By.xpath(`((//main//section/div[@class="pvs-list__container"]/div/div/ul[@class="pvs-list "]/li/div/div/div[@class="display-flex flex-column full-width align-self-center"])[${k + 1}]//a/span[@class="t-14 t-normal"])[1]`)).getText();
                        //                                     } catch (error) {
                        //                                         console.error(error)
                        //                                     }

                        //                                     console.error(error)
                        //                                 }
                        //                             }
                        //                         }
                        //                         catch (err) {
                        //                             // // console.log("inside else", err);
                        //                             try {
                        //                                 companyvalue = await driver.findElement(By.xpath(`(//main//section/div[@class="pvs-list__container"]/div/div/ul[@class="pvs-list "]/li/div/div/div[@class="display-flex flex-column full-width align-self-center"])[${k + 1}]/div[@class="display-flex flex-row justify-space-between"]/div/div//span[@aria-hidden="true"]`)).getText();
                        //                             }
                        //                             catch (error) {
                        //                                 console.error(error)
                        //                             }
                        //                             try {
                        //                                 value = await driver.findElement(By.xpath(`(//main//section/div[@class="pvs-list__container"]/div/div/ul[@class="pvs-list "]/li/div/div/div[@class="display-flex flex-column full-width align-self-center"])[${k + 1}]/div[@class="display-flex flex-row justify-space-between"]/div/span[@class="t-14 t-normal"]/span[@aria-hidden="true"]`)).getText();
                        //                             }
                        //                             catch (error) {
                        //                                 console.error(error)
                        //                             }
                        //                             try {
                        //                                 year = await driver.findElement(By.xpath(`((//main//section/div[@class="pvs-list__container"]/div/div/ul[@class="pvs-list "]/li/div/div/div[@class="display-flex flex-column full-width align-self-center"])[${k + 1}]/div[@class="display-flex flex-row justify-space-between"]/div/span[@class="t-14 t-normal t-black--light"]/span[@aria-hidden="true"])[1]`)).getText();
                        //                             } catch (error) {

                        //                                 console.error(error)
                        //                             }
                        //                         }
                        //                         experienceValueArr.push({ company: companyvalue, companyDetail: value, year: year });
                        //                         // // console.log({ company: companyvalue, companyDetail: value, year: year }, "{ company: companyvalue, companyDetail: value, year: year }");
                        //                     }
                        //                 }
                        //                 resultsArr[j].experienceArr = experienceValueArr
                        //                 // // console.log(experienceValueArr, "experienceValueArr")
                        //             }
                        //         }
                        //         catch (err) {
                        //             console.error(err)
                        //         }

                        //         let rating = "";
                        //         rating = CalculateRating(resultsArr[j])
                        //         // // // console.log("ratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingrating", rating, "ratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingrating")
                        //         ////////////adding client for campaigns
                        let clientObj;
                        let clientExistsCheck = await User.findOne({ name: new RegExp(`^${resultsArr[j].name}$`), url: new RegExp(`^${resultsArr[j].url}$`), role: rolesObj?.CLIENT })
                            .lean()
                            .exec();
                        // console.log("clientExistsCheck", clientExistsCheck);
                        if (!clientExistsCheck) {
                            clientObj = await new User({ ...resultsArr[j], role: rolesObj?.CLIENT, campaignId: campaignObj?._id }).save();
                            // console.log("clientObj", clientObj);
                            if (campaignObj) {
                                let leadsArr = await new Lead({ clientId: clientObj._id, campaignId: campaignObj._id, isSearched: true }).save();
                            }
                        } else {
                            let obj = {
                                ...clientExistsCheck,
                                campaignName: campaignObj?.name,
                                // rating: rating,
                                campanignId: campaignObj?._id,
                                searchQuery: campaignObj?.searchQuery,
                                accountName: campaignObj?.accountName,
                                searchedSchool: campaignObj?.school,
                                searchedCompany: campaignObj?.company,
                                totalResults: campaignObj?.totalResults,
                            };
                            delete obj._id;
                            // // console.log(obj)
                            let temp = await new PreviousLeads(obj).save();
                            // // console.log(temp, "temp")
                            // clientExistsCheck
                            clientObj = await User.findByIdAndUpdate(clientExistsCheck._id, { ...resultsArr[j], role: rolesObj?.CLIENT, campaignId: campaignObj?._id, searchCompleted: true }, { new: true }).exec();
                        }
                        if (campaignObj) {
                            let leadsArr = await Lead.findOneAndUpdate({ clientId: clientExistsCheck?._id }, { clientId: clientObj._id, campaignId: campaignObj._id, isSearched: true }).exec();
                        }

                        await new UserLogs({ ...resultsArr[j], role: rolesObj?.CLIENT, campaignId: campaignObj._id, userId: clientObj?._id }).save();

						// console.log(`campaignObj 333===>>> ${JSON.stringify(campaignObj)}`);
						// console.log(`clientObj 333===>>> ${clientObj}`);
                        let resultData = await Campaign.findByIdAndUpdate(campaignObj._id, { $push: { resultsArr: { clientId: clientObj._id } } }).exec();
						// console.log(`resultData ===>>> ${campaignObj._id}, ${resultData}`);
                        // await driver.sleep(10000)
                    } catch (err) {
                        console.error(err);
                    }
                }
                // await driver.quit();

                // let clientsArr = []
                // for (const el of resultsArr) {
                //     let clientObj
                //     let clientExistsCheck = await User.findOne({ name: el.name, url: el.url, role: rolesObj?.CLIENT }).exec()
                //     if (!clientExistsCheck) {
                //         clientObj = await new User({ ...el, role: rolesObj?.CLIENT }).save()
                //     }
                //     else {
                //         clientObj = await User.findByIdAndUpdate(clientExistsCheck._id, { el, role: rolesObj?.CLIENT }, { new: true }).exec()
                //     }
                //     // // console.log(clientObj)
                //     clientsArr.push(clientObj)
                // }

                // if (clientsArr) {
				if (campaignObj) {
					//         // // console.log(campaignObj, "el,campaignObj", clientsArr)
					// let leadsArr = await Lead.insertMany([...clientsArr.map(el => ({ clientId: el._id, ...el, campaignId: campaignObj._id }))])
					// // // console.log(leadsArr, "leadsArr")
					//     }

					let campaignId = campaignObj?._id;

					delete campaignObj?._id;
					delete campaignObj?.timesRun;

					// let dataToStore = { totalResults: totalResults, processing: false, isSearched: true, status: "COMPLETED", $inc: { timesRun: 1 } };
					// await Campaign.findByIdAndUpdate(campaignId, dataToStore).exec();

					let dataToStore = { ...campaignObj, totalResults: totalResults, processing: false, isSearched: true, status: "COMPLETED" };
					console.log(`campaignId 111===>>> ${campaignId}`);
					console.log(`dataToStore 111===>>> ${JSON.stringify(dataToStore)}`);
					await new Promise((resolve) => setTimeout(resolve, 10000));
					console.log(`campaignId 222===>>> ${campaignId}`);
					console.log(`dataToStore 222===>>> ${JSON.stringify(dataToStore)}`);
					await Campaign.findByIdAndUpdate(campaignId, dataToStore).exec();
					console.log(`completed ===>>> ${JSON.stringify(dataToStore)}`);
					// console.log(`campaignUpdatedObj ===>>> ${campaignUpdatedObj}`);
                }

                // // console.log("completed")
            } catch (error) {
                console.error("ERROR IN CAMPAIGN LOOP", error);
            }
        }
    } catch (error) {
        console.error("ERROR", error);
        await redisClientParam.set("isFree", "true");
        throw error;
    }
    await redisClientParam.set("isFree", "true");
    return true;
};
