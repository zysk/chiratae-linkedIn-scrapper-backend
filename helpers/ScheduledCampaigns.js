import { driver as maindriver, redisClient } from '../app';
import Campaign from "../models/Campaign.model";
import { generalModelStatuses } from "./Constants";
import { sendMail } from "./nodeMailer";

import { By, Key, until } from 'selenium-webdriver';
import Lead from '../models/leads.model';
import User from '../models/user.model';
// const chrome = require('/usr/bin/chromedriver');  ///////chrome for server
// const chrome = require('./chromedriver').path;
import { rolesObj } from '../helpers/Constants';
import { seleniumErrorHandler } from '../helpers/seleniumErrorHandler';
import { generateRandomNumbers } from './utils';




export const getScheduledCampaignsForToday = async (beforeDate = null) => {
    try {
        redisClient.set("isBusy", "true")
        console.log("inside cron function")

        let todayEnd = new Date()
        if (!beforeDate) {
            todayEnd.setHours(23, 59, 59, 59)
        }
        else {
            todayEnd = new Date(beforeDate)
        }


        console.log(todayEnd.toDateString(), todayEnd.toTimeString(), "todayEnd,todayStart")
        console.log(new Date("2023-01-12T18:30:00.000+00:00").toDateString(), new Date("2023-01-12T18:30:00.000+00:00").toTimeString())
        let campaignsArr = await Campaign.find({ status: generalModelStatuses.CREATED, scheduled: true, scheduleDate: { $lte: todayEnd } }).exec()
        console.log(campaignsArr, "campaignsArr")




        if (campaignsArr && campaignsArr.length > 0) {

            let driver = await maindriver
            let page = await driver.get("https://www.linkedin.com");

            driver.sleep(generateRandomNumbers(4))
            let isLogin = false
            let url = await driver.getCurrentUrl()
            console.log("url:",)

            if (url.includes('feed')) {
                isLogin = true
            }
            else {
                sendMail("mulahajedu@jollyfree.com", todayEnd.toISOString())
                redisClient.set("isBusy", "false")
                return;
            }



            for (let q = 0; q < campaignsArr.length; q++) {


                let totalResults = ''
                let resultsArr = []

                let page2 = await driver.get("https://www.linkedin.com");


                let searchInput = await driver.wait(until.elementLocated(By.xpath(`//input[@class="search-global-typeahead__input"]`)));
                console.log("SEARCH INPUT FOUND")



                let campaignObj = campaignsArr[q]
                console.log(campaignObj, "campaignObj")
                console.log("url:", await driver.getCurrentUrl())
                if (searchInput) {
                    /////////searching for search input on linkedin and entering the query sent by user and submiting the input

                    await driver.findElement(By.xpath(`//input[@class="search-global-typeahead__input"]`)).sendKeys(`${campaignsArr[q].searchQuery}`, Key.ENTER)
                    ///////////search input filled , now looking for people filter on linkedin
                    let filterClick = await driver.wait(until.elementLocated(By.xpath("//button[text()='People']")))
                    if (filterClick) {

                        console.log("FILTER CLICKED FOUND")
                        //////clicking on people filter 
                        await driver.findElement(By.xpath("//button[text()='People']")).click()
                        /////checking if the page is completely loaded or not 
                        console.log("FILTER 1")
                        try {

                            let filterResultsVisibleClick = await driver.wait(until.elementLocated(By.xpath(`//div[@class="search-results-container"]//h2[@class="pb2 t-black--light t-14"]`)), 5000)
                            if (filterResultsVisibleClick) {
                                ///////scrolling the page to bottom because linked in does not load the whole page until its scrolled
                                await driver.executeScript(`window.scrollTo(0, 4500)`)
                                ////////locating all filters button 
                                try {

                                    let allFiltersClick = await driver.wait(until.elementLocated(By.xpath(`// div[@class="relative mr2"]//button[text() = "All filters"]`,)))
                                    if (allFiltersClick) {
                                        ////////clicking on all filters button
                                        await driver.findElement(By.xpath(`// div[@class="relative mr2"]//button[text() = "All filters"]`,)).click()
                                        ////////locating company filter
                                        let companyButton = await driver.wait(until.elementLocated(By.xpath(`//ul//li//fieldset//h3[text()="Current company"]/following-sibling::div//ul//li[last()]//button`)))
                                        if (companyButton) {
                                            ////////waiting for the elements to load
                                            await driver.sleep(generateRandomNumbers(4))
                                            ////////clicking on the company button to reveal text input
                                            await driver.findElement(By.xpath(`//ul//li//fieldset//h3[text()="Current company"]/following-sibling::div//ul//li[last()]//button`)).click()
                                            ////////clicking on the text input to get it in focus
                                            await driver.findElement(By.xpath(`//ul//li//fieldset//h3[text()="Current company"]/following-sibling::div//ul//li[last()]//div[@class="search-reusables__filter-new-value-typeahead"]//div//input`)).click()
                                            ////////Entering values in the text input
                                            await driver.findElement(By.xpath(`//ul//li//fieldset//h3[text()="Current company"]/following-sibling::div//ul//li[last()]//div[@class="search-reusables__filter-new-value-typeahead"]//div//input`)).sendKeys(campaignsArr[q].company)
                                            ////////waiting for the elements to load
                                            await driver.sleep(generateRandomNumbers(4))
                                            ////////clicking on the text input to get it in focus
                                            await driver.findElement(By.xpath(`//ul//li//fieldset//h3[text()="Current company"]/following-sibling::div//ul//li[last()]//div[@class="search-reusables__filter-new-value-typeahead"]//div//input`)).click()
                                            ////////pressing down key to highlight the first result
                                            await driver.findElement(By.xpath(`//ul//li//fieldset//h3[text()="Current company"]/following-sibling::div//ul//li[last()]//div[@class="search-reusables__filter-new-value-typeahead"]//div//input`)).sendKeys(Key.ARROW_DOWN)
                                            ////////pressing down enter to select the first result
                                            await driver.findElement(By.xpath(`//ul//li//fieldset//h3[text()="Current company"]/following-sibling::div//ul//li[last()]//div[@class="search-reusables__filter-new-value-typeahead"]//div//input`)).sendKeys(Key.ENTER)
                                        }
                                        ////////locating school filter
                                        let SchoolButton = await driver.wait(until.elementLocated(By.xpath(`//ul//li//fieldset//h3[text()="School"]/following-sibling::div//ul//li[last()]//button`)))
                                        if (SchoolButton) {
                                            ////////waiting for the elements to load
                                            await driver.sleep(generateRandomNumbers(4))
                                            ////////clicking on the school button to reveal text input
                                            await driver.findElement(By.xpath(`//ul//li//fieldset//h3[text()="School"]/following-sibling::div//ul//li[last()]//button`)).click()
                                            ////////clicking on the text input to get it in focus
                                            await driver.findElement(By.xpath(`//ul//li//fieldset//h3[text()="School"]/following-sibling::div//ul//li[last()]//div[@class="search-reusables__filter-new-value-typeahead"]//div//input`)).click()
                                            ////////Entering values in the text input
                                            await driver.findElement(By.xpath(`//ul//li//fieldset//h3[text()="School"]/following-sibling::div//ul//li[last()]//div[@class="search-reusables__filter-new-value-typeahead"]//div//input`)).sendKeys(campaignsArr[q].school)
                                            ////////waiting for the elements to load
                                            await driver.sleep(generateRandomNumbers(4))
                                            ////////clicking on the text input to get it in focus
                                            await driver.findElement(By.xpath(`//ul//li//fieldset//h3[text()="School"]/following-sibling::div//ul//li[last()]//div[@class="search-reusables__filter-new-value-typeahead"]//div//input`)).click()
                                            ////////pressing down key to highlight the first result
                                            await driver.findElement(By.xpath(`//ul//li//fieldset//h3[text()="School"]/following-sibling::div//ul//li[last()]//div[@class="search-reusables__filter-new-value-typeahead"]//div//input`)).sendKeys(Key.ARROW_DOWN)
                                            ////////pressing down enter to select the first result
                                            await driver.findElement(By.xpath(`//ul//li//fieldset//h3[text()="School"]/following-sibling::div//ul//li[last()]//div[@class="search-reusables__filter-new-value-typeahead"]//div//input`)).sendKeys(Key.ENTER)
                                        }
                                        ////////waiting for the elements to load
                                        await driver.sleep(generateRandomNumbers(4))
                                        ////////locating show results button
                                        let showResults = await driver.wait(until.elementLocated(By.xpath(`//button[@data-test-reusables-filters-modal-show-results-button="true" and @aria-label="Apply current filters to show results"]`)))
                                        if (showResults) {
                                            ////////clicking on show results button
                                            await driver.findElement(By.xpath(`//button[@data-test-reusables-filters-modal-show-results-button="true" and @aria-label="Apply current filters to show results"]`)).click()
                                        }
                                    }
                                }
                                catch (err) {
                                    seleniumErrorHandler()
                                }


                                ////////waiting for the elements to load
                                await driver.sleep(generateRandomNumbers(4))
                                ////////locating total results div

                                ///////scrolling the page to bottom because linked in does not load the whole page until its scrolled
                                await driver.executeScript(`window.scrollTo(0, 4500)`)

                                // getting total results
                                try {
                                    console.log("FILTER 2")
                                    totalResults = await driver.findElement(By.xpath(`//div[@class="search-results-container"]//h2[@class="pb2 t-black--light t-14"]`)).getText()
                                    console.log("TOTAL RESULTS", totalResults)

                                    await Campaign.findByIdAndUpdate(campaignObj._id, { totalResults: totalResults, }).exec()
                                } catch (error) {
                                    console.error(error)
                                    seleniumErrorHandler()
                                }





                                console.log("SCROLL TO BOTTOM THE FFIRST")
                                ////////locating next button
                                try {
                                    let nextbutton = await driver.wait(until.elementsLocated(By.xpath(`//button[@aria-label="Next"]//span[text()='Next']`)), 5000)
                                    console.log(nextbutton, "nextbutton")
                                    if (nextbutton) {
                                        ////////finding if next button is enabled or not
                                        let nextbuttonText = await driver.findElement(By.xpath(`//button[@aria-label="Next"]//span[text()='Next']`)).isEnabled()
                                        while (nextbuttonText) {

                                            try {

                                                console.log("FILTER 3")
                                                let resultText = await driver.wait(until.elementLocated(By.xpath(`//div[@class="search-results-container"]//h2[@class="pb2 t-black--light t-14"]`)), 5000)
                                                if (resultText) {
                                                    ////////getting value of total results
                                                }
                                            } catch (error) {
                                                console.error(error)
                                            }

                                            ///////scrolling the page to bottom because linked in does not load the whole page until its scrolled
                                            await driver.executeScript(`window.scrollTo(0, 4500)`)

                                            console.log("SCROLL TO BOTTOM THE ALT")
                                            ////////waiting for the elements to load
                                            await driver.sleep(generateRandomNumbers(4))
                                            ////////locating results div
                                            try {
                                                let resultElement = await driver.wait(until.elementsLocated(By.xpath(`//ul[@class="reusable-search__entity-result-list list-style-none"]//li//div[@class="entity-result"]//div[@class="entity-result__item"]//div[@class="entity-result__content entity-result__divider pt3 pb3 t-12 t-black--light"]`)), 5000)
                                                if (resultElement) {

                                                    console.log(resultElement.length, "resultElement.length")
                                                    ///////looping through the results
                                                    for (let i = 0; i < resultElement.length; i++) {
                                                        let obj = {}
                                                        ///////locating name of the users
                                                        let name = await driver.findElement(By.xpath(`(//div[@class="entity-result__item"]//div[@class="entity-result__content entity-result__divider pt3 pb3 t-12 t-black--light"])[${i + 1}]//span//span/a`)).getText()
                                                        if (name) {
                                                            obj.name = name?.split("\n")[0]
                                                        }
                                                        ///////locating profile link of the users
                                                        let linkValue = await driver.findElement(By.xpath(`(//div[@class="entity-result__item"]//div[@class="entity-result__content entity-result__divider pt3 pb3 t-12 t-black--light"])[${i + 1}]//span//span/a`)).getAttribute("href")
                                                        if (linkValue) {
                                                            obj.link = linkValue
                                                        }
                                                        console.log(obj, i, "obj")
                                                        resultsArr.push(obj)
                                                    }
                                                }
                                            }
                                            catch (err) {
                                                seleniumErrorHandler()
                                            }
                                            ///////scrolling the page to bottom because linked in does not load the whole page until its scrolled
                                            await driver.executeScript(`window.scrollTo(0, 4500)`)


                                            console.log("SCROLL TO BOTTOM THE ALT3.1 ")
                                            ////////waiting for the elements to load
                                            await driver.sleep(generateRandomNumbers(4))
                                            ////////finding if next button is visible or not
                                            try {
                                                let nextbuttonIsValid = await driver.wait(until.elementIsVisible(driver.findElement(By.xpath(`//button[@aria-label="Next"]//span[text()='Next']`))), 1000)
                                                if (nextbuttonIsValid) {
                                                    ////////finding if next button is enabled or not
                                                    nextbuttonText = await driver.findElement(By.xpath(`//button[@aria-label="Next"]`)).isEnabled()
                                                    if (nextbuttonText) {
                                                        ////////locating next button
                                                        let nextButtonValue1 = await driver.wait(until.elementLocated(By.xpath(`//button[@aria-label="Next"]`)))
                                                        // console.log("nextButtonValue1", nextButtonValue1)
                                                        if (nextButtonValue1) {
                                                            ////////clicking on next button
                                                            await driver.findElement(By.xpath(`//button[@aria-label="Next"]`))?.click()
                                                        }
                                                    }
                                                    else {
                                                        break;
                                                    }
                                                }
                                                else {
                                                    break;
                                                }
                                            }
                                            catch (err) {
                                                seleniumErrorHandler()
                                            }
                                        }
                                    }
                                }
                                catch (err) {

                                    console.log("else case")
                                    ///////scrolling the page to bottom because linked in does not load the whole page until its scrolled
                                    await driver.executeScript(`window.scrollTo(0, 4500)`)

                                    console.log("SCROLL TO BOTTOM THE ALT3.2 ")
                                    ////////waiting for the elements to load
                                    await driver.sleep(generateRandomNumbers(4))

                                    try {

                                        console.log("FILTER 4")
                                        let resultText = await driver.wait(until.elementLocated(By.xpath(`//div[@class="search-results-container"]//h2[@class="pb2 t-black--light t-14"]`)), 5000)
                                        if (resultText) {
                                            ////////getting value of total results

                                            console.log("FILTER 5")
                                            totalResults = await driver.findElement(By.xpath(`//div[@class="search-results-container"]//h2[@class="pb2 t-black--light t-14"]`)).getText()
                                            console.log("TOTAL RESULTS", totalResults)
                                        }
                                    } catch (error) {
                                        console.error(error)
                                        seleniumErrorHandler()
                                    }



                                    ////////locating results div
                                    try {
                                        let resultElement = await driver.wait(until.elementsLocated(By.xpath(`//ul[@class="reusable-search__entity-result-list list-style-none"]//li//div[@class="entity-result"]//div[@class="entity-result__item"]//div[@class="entity-result__content entity-result__divider pt3 pb3 t-12 t-black--light"]`)), 5000)
                                        if (resultElement) {
                                            ///////looping through the results
                                            for (let i = 0; i < resultElement.length; i++) {
                                                let obj = {}
                                                ///////locating name of the users
                                                let name = await driver.findElement(By.xpath(`(//div[@class="entity-result__item"]//div[@class="entity-result__content entity-result__divider pt3 pb3 t-12 t-black--light"])[${i + 1}]//span//span/a`)).getText()
                                                if (name) {
                                                    obj.name = name?.split("\n")[0]
                                                }
                                                ///////locating profile link of the users
                                                let linkValue = await driver.findElement(By.xpath(`(//div[@class="entity-result__item"]//div[@class="entity-result__content entity-result__divider pt3 pb3 t-12 t-black--light"])[${i + 1}]//span//span/a`)).getAttribute("href")
                                                if (linkValue) {
                                                    obj.link = linkValue
                                                }
                                                console.log(obj, i, "obj")
                                                resultsArr.push(obj)
                                            }
                                        }
                                    }
                                    catch (err) {
                                        seleniumErrorHandler()
                                    }
                                }

                            }
                        }
                        catch (err) {
                            seleniumErrorHandler()
                        }
                    }
                }




                let clientsArr = []
                for (const el of resultsArr) {
                    let clientObj

                    let rating = "";
                    rating = CalculateRating(el)



                    let clientExistsCheck = await User.findOne({ name: el.name, url: el.url, role: rolesObj?.CLIENT }).exec()
                    if (!clientExistsCheck) {
                        clientObj = await new User({ ...el, role: rolesObj?.CLIENT, rating: rating }).save()
                    }
                    else {
                        clientObj = await User.findByIdAndUpdate(clientExistsCheck._id, { el, role: rolesObj?.CLIENT, searchCompleted: false, rating: rating }, { new: true }).exec()
                    }
                    console.log(clientObj)
                    clientsArr.push(clientObj)
                }


                if (clientsArr) {
                    clientsArr = clientsArr.map(el => ({ clientId: el._id }))
                    let campaignObj1 = await Campaign.findByIdAndUpdate(campaignsArr[q]._id, { ...campaignsArr[q], totalResults: totalResults, resultsArr: clientsArr, isSearched: true }, { new: true }).exec()
                    if (campaignObj1) {
                        console.log(campaignObj1, "el,campaignObj", clientsArr)
                        let leadsArr = await Lead.insertMany([...clientsArr.map(el => ({ clientId: el._id, ...el, campaignId: campaignObj1._id }))])
                        console.log(leadsArr, "leadsArr")
                    }
                    let campaignUpdatedObj = await Campaign.findByIdAndUpdate(campaignsArr[q]._id, { resultsArr: clientsArr }, { new: true }).exec()
                }

                // let lengthOfArray = resultsArr.filter(el => el.link && el.link != "").length

                /////user profile data scraping
                // for (let j = 0; j < lengthOfArray; j++) {
                //     try {
                //         console.log("LinkedIn", j + 1, lengthOfArray)
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
                //                 await driver.sleep(2000)
                //                 let contactInfoArr = [];

                //                 ////// //h3
                //                 try {
                //                     let contactInfoElementsExists = await driver.wait(until.elementLocated(By.xpath(`//section[@class="pv-profile-section pv-contact-info artdeco-container-card"]//div[@class="pv-profile-section__section-info section-info"]//section`)), 5000)
                //                     if (contactInfoElementsExists) {
                //                         let contactInfoElements = await driver.findElements(By.xpath(`//section[@class="pv-profile-section pv-contact-info artdeco-container-card"]//div[@class="pv-profile-section__section-info section-info"]//section`))
                //                         await driver.sleep(2000)

                //                         console.log(contactInfoElements, contactInfoElements.length, "contactInfoElements")
                //                         let obj = {}
                //                         for (let q = 0; q < contactInfoElements.length; q++) {

                //                             obj = {
                //                                 heading: "",
                //                                 dataArr: []
                //                             }

                //                             console.log(q, "k")
                //                             try {
                //                                 let contactInfoHeading = await driver.findElement(By.xpath(`(//section[@class="pv-profile-section pv-contact-info artdeco-container-card"]//div[@class="pv-profile-section__section-info section-info"]//section//h3)[${q + 1}]`), 5000)
                //                                 if (contactInfoHeading) {
                //                                     obj.heading = await driver.findElement(By.xpath(`(//section[@class="pv-profile-section pv-contact-info artdeco-container-card"]//div[@class="pv-profile-section__section-info section-info"]//section//h3)[${q + 1}]`)).getText()
                //                                     console.log(obj.heading, "heading")
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

                //                                             console.log(contactLinkElement, "contactLinkElement")

                //                                             obj.dataArr.push(contactLinkElement);
                //                                         }
                //                                     }
                //                                 }
                //                             }
                //                             catch (err) {
                //                                 console.log("inside, catch", err)
                //                                 try {
                //                                     let contactInfoListExists = await driver.wait(until.elementsLocated(By.xpath(`((//section[@class="pv-profile-section pv-contact-info artdeco-container-card"]//div[@class="pv-profile-section__section-info section-info"]//section)[${q + 1}]/ul/li)`)), 5000)
                //                                     if (contactInfoListExists) {

                //                                         let contactInfoList = await driver.findElements(By.xpath(`((//section[@class="pv-profile-section pv-contact-info artdeco-container-card"]//div[@class="pv-profile-section__section-info section-info"]//section)[${q + 1}]/ul/li)`))
                //                                         if (contactInfoList) {
                //                                             for (let p = 0; p < contactInfoList.length; p++) {
                //                                                 let contactInfoListValue = await driver.findElement(By.xpath(`(((//section[@class="pv-profile-section pv-contact-info artdeco-container-card"]//div[@class="pv-profile-section__section-info section-info"]//section)[${q + 1}]/ul/li)[${p + 1}]/span)[1]`)).getText()
                //                                                 console.log(contactInfoListValue, "contactInfoListValue")

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
                //                                     console.log(err)
                //                                 }

                //                                 console.error(err, "could not find contact info h3")
                //                             }
                //                             console.log(obj, "obj")
                //                             contactInfoArr.push(obj)
                //                         }

                //                     }
                //                     else {
                //                         console.log("not found")
                //                     }

                //                 }
                //                 catch (err) {
                //                     console.error(err, "could not find contact info section tags")
                //                     seleniumErrorHandler()
                //                 }
                //                 console.log(contactInfoArr, "contactInfoArr")
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
                //             await driver.sleep(2000)


                //             try {
                //                 let tempEducationArrExists = await driver.wait(until.elementLocated(By.xpath(`(//ul/li[@class="pvs-list__paged-list-item artdeco-list__item pvs-list__item--line-separated "])`)), 5000)
                //                 if (tempEducationArrExists) {
                //                     let internalEducationarr = await driver.findElements(By.xpath(`(//ul/li[@class="pvs-list__paged-list-item artdeco-list__item pvs-list__item--line-separated "])`))

                //                     console.log(internalEducationarr, "internnaleducation arr")
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
                //                         console.log(obj, "education Obj")
                //                         tempEducationArr.push(obj)
                //                     }

                //                 }







                //             }
                //             catch (err) {
                //                 console.error(err)
                //                 seleniumErrorHandler()
                //             }

                //             resultsArr[j].educationArr = tempEducationArr
                //             console.log(tempEducationArr, "tempEducationArr")






                //         }
                //         catch (err) {
                //             console.error(err)
                //             seleniumErrorHandler()
                //         }
                //         console.log("getExperience", `${resultsArr[j].link}/details/experience/`)
                //         await driver.get(`${currentUrl}/details/experience/`);
                //         await driver.sleep(2000)
                //         try {
                //             let experienceFound = await driver.wait(until.elementLocated(By.xpath(`//main//section/div[@class="pvs-list__container"]/div/div/ul[@class="pvs-list "]/li/div/div/div[@class="display-flex flex-column full-width align-self-center"]`)), 5000)

                //             if (experienceFound) {
                //                 let experienceArr = await driver.findElements(By.xpath(`//main//section/div[@class="pvs-list__container"]/div/div/ul[@class="pvs-list "]/li/div/div/div[@class="display-flex flex-column full-width align-self-center"]`))
                //                 console.log(experienceArr, "experienceArr", experienceArr.length)
                //                 let experienceValueArr = []

                //                 if (experienceArr && experienceArr.length > 0) {
                //                     for (let k = 0; k < experienceArr.length; k++) {
                //                         let companyvalue = ""
                //                         let value = ""
                //                         let year = ""
                //                         try {
                //                             let checkElementHasAnchorTag = await driver.findElement(By.xpath(`(//main//section/div[@class="pvs-list__container"]/div/div/ul[@class="pvs-list "]/li//div/div/div[@class="display-flex flex-column full-width align-self-center"])[${k + 1}]/div[@class="display-flex flex-row justify-space-between"]/a`), 5000);
                //                             if (checkElementHasAnchorTag) {
                //                                 console.log("inside if")
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
                //                             console.log("inside else", err);
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
                //                         console.log({ company: companyvalue, companyDetail: value, year: year }, "{ company: companyvalue, companyDetail: value, year: year }");
                //                     }
                //                 }
                //                 resultsArr[j].experienceArr = experienceValueArr
                //                 console.log(experienceValueArr, "experienceValueArr")
                //             }
                //         }
                //         catch (err) {
                //             console.error(err)
                //         }




                //         ////////////adding client for campaigns
                //         let clientObj
                //         let clientExistsCheck = await User.findOne({ name: new RegExp(`^${resultsArr[j].name}$`), url: new RegExp(`^${resultsArr[j].url}$`), role: rolesObj?.CLIENT }).exec()
                //         if (!clientExistsCheck) {
                //             clientObj = await new User({ ...resultsArr[j], role: rolesObj?.CLIENT }).save()
                //         }
                //         else {
                //             console.log("Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists,Exists")
                //             clientObj = await User.findByIdAndUpdate(clientExistsCheck._id, { ...resultsArr[j], role: rolesObj?.CLIENT }, { new: true }).exec()
                //         }



                //         await Campaign.findByIdAndUpdate(campaignObj._id, { $push: { resultsArr: { clientId: clientObj._id } } }).exec()
                //         if (campaignObj) {
                //             // console.log(campaignObj, "el,campaignObj", clientsArr)
                //             let leadsArr = await new Lead({ clientId: clientObj._id, campaignId: campaignObj._id }).save()
                //         }


                //         await driver.sleep(1000)
                //     }
                //     catch (err) {
                //         console.error(err);
                //     }
                // }

                if (campaignObj) {
                    console.log("asd", "asd", campaignsArr[q])
                    let campaignUpdatedObj = await Campaign.findByIdAndUpdate(`${campaignsArr[q]._id}`, { totalResults: totalResults, processing: false, isSearched: true, status: "COMPLETED" }).exec()
                    console.log(campaignUpdatedObj, "campaignUpdatedObj")
                }
                console.log("completed")

            }
            redisClient.set("isBusy", "false");
        }
    }


    catch (err) {
        asd
        console.error(err)
    }
    // return campaignsArr

}