import fs from 'fs';
import Campaign from '../models/Campaign.model';
import Lead from '../models/leads.model';
import User from '../models/user.model';
import { Builder, By, Key, until, getAttribute, Window } from 'selenium-webdriver';
// const chrome = require('/usr/bin/chromedriver');  ///////chrome for server
// const chrome = require('./chromedriver').path;
import chrome, { ServiceBuilder } from 'selenium-webdriver/chrome';
import { PageLoadStrategy } from 'selenium-webdriver/lib/capabilities';
import { rolesObj } from '../helpers/Constants';
import CampaignModel from '../models/Campaign.model';
import path from 'path';
import ProxiesModel from '../models/Proxies.model';
import SeleniumSessionModel from '../models/SeleniumSession.model';
import { driver as maindriver } from '../app';






//account name alwin ebslon 
///email: alwin.ponnan@ebslon.com
///password: 9910724206a@

//account name alwin test 
///email: alwintest25946@gmail.com
///password: 9910724206a@

//account name alwin favcy 
///email: alwin.ponnan@favcy.in
///password: 9910724206a@



//account name devesh sir 
///email: devesh.batra@ebslon.com
///password: Haier2018@






export const linkedInLogin = async (req, res, next) => {
    try {
        let isCaptcha = false

        let options = new chrome.Options();
        // options.addArguments('--headless');
        options.setPageLoadStrategy(PageLoadStrategy.EAGER)
        options.addArguments('--disable-gpu');
        options.addArguments('--window-size=1920,1080');

        let imgUrl = ""

        if (req.body.proxyId) {
            try {

                let proxyObj = await ProxiesModel.findById(req.body.proxyId)
                if (proxyObj) {

                    let proxyAddress = proxyObj.value
                    options.addArguments(`--proxy-server=${proxyAddress}`)
                    console.log('PROXY SET TO ', `--proxy-server=${proxyAddress}`)
                }

            } catch (error) {
                console.error("PROXY ERROR", error)
            }
        }

        const chromeDriverPath = path.join(process.cwd(), "chromedriver"); // or wherever you've your geckodriver
        const serviceBuilder = new ServiceBuilder(chromeDriverPath);

        if (req.body.proxyId) {
            try {

                let proxyObj = await ProxiesModel.findById(req.body.proxyId)
                if (proxyObj) {

                    let proxyAddress = proxyObj.value
                    options.addArguments(`--proxy-server=${proxyAddress}`)
                    console.log('PROXY SET TO ', `--proxy-server=${proxyAddress}`)
                }

            } catch (error) {
                console.error("PROXY ERROR", error)
            }
        }



        let driver = await maindriver

        // let driver = await new Builder()
        //     .forBrowser("chrome")
        //     .setChromeService(serviceBuilder)
        //     .setChromeOptions(options).build()




        try {

            // await driver.get('http://httpbin.org/ip')

            // await driver.sleep(3000)
            let data = await driver.getPageSource()

            let page = await driver.get("https://www.linkedin.com");
            console.log("url:", await driver.getCurrentUrl())
            ///////checking if the page is loaded
            if (handleCheckPageLoaded(driver)) {

                // login code start
                if (req.body.oneTimeLink) {
                    let page = await driver.get(req.body.oneTimeLink); // one time login link

                }
                else {


                    console.log("url:", await driver.getCurrentUrl())
                    /////////searching for email/phone field 
                    let accountName = await driver.wait(until.elementsLocated(By.id("session_key")))
                    if (accountName) {
                        /////////searching for email/phone field 
                        await driver.findElement(By.id("session_key")).sendKeys(`${req.body.accountName}`)
                    }
                    /////////searching for password field 
                    let password = await driver.wait(until.elementsLocated(By.id("session_password")))
                    if (password) {
                        /////////entering value for password field 
                        await driver.findElement(By.id("session_password")).sendKeys(`${req.body.password}`)
                    }
                    ///////////searching the login page





                    console.log("url:", await driver.getCurrentUrl())
                    let submitbutton = await driver.wait(until.elementsLocated(By.xpath(`//button[@type="submit" and @class="sign-in-form__submit-button"]`)))
                    if (submitbutton) {
                        ///////////submiting the login page
                        await driver.findElement(By.xpath(`//button[@type="submit" and @class="sign-in-form__submit-button"]`)).click()
                    }

                    // login code end

                    console.log("LOGIN")

                    console.log("url:", await driver.getCurrentUrl())



                }

                ////////waiting for the elements to load
                await driver.sleep(3000)
                let url = await driver.getCurrentUrl()

                console.log("url:", await driver.getCurrentUrl())



                // let data = await driver.getPageSource()
                // console.log(data)


                // let session = await driver.getSession()
                // let capabilities = await driver.getCapabilities()


                // await new SeleniumSessionModel({ sessiong_data: session, capabilities: capabilities }).save()


                if (url.includes('checkpoint')) { //captcha
                    isCaptcha = true
                    let img = await driver.wait(until.elementLocated(By.xpath(`// iframe[@id="captcha-internal"]`,)))
                    console.log("Switch to outer outer frame")
                    await driver.switchTo().frame("captcha-internal");
                    console.log("Switch to outer outer frame")
                    await driver.sleep(1000)

                    console.log("Switch to outer frame")
                    await driver.switchTo().frame("arkoseframe");
                    console.log("Switch to outer frame")
                    await driver.sleep(1000)

                    await driver.switchTo().frame("fc-iframe-wrap");
                    console.log("Switch to frame")
                    await driver.sleep(1000)

                    console.log("Switch to inner frame")
                    await driver.switchTo().frame("CaptchaFrame");
                    console.log("url:", await driver.getCurrentUrl())

                    try {
                        console.log("CLik verify")
                        let img = await driver.wait(until.elementLocated(By.xpath(`// button[@id="home_children_button"]`,))).click()
                        // url = img?.getAttribute('src');
                        console.log("url:", await driver.getCurrentUrl())
                    } catch (error) {
                        console.error(error)
                    }




                    try {
                        console.log("GETTING GETTING IMAGES")
                        let img = await driver.wait(until.elementLocated(By.xpath(`// div[@id="game_challengeItem"]//img`,)))
                        imgUrl = await img?.getAttribute('src');
                        console.log(imgUrl)
                        console.log("url:", await driver.getCurrentUrl())
                    } catch (error) {
                        console.error(error)
                    }



                }





            }

        } catch (error) {
            console.error(error)
        }
        // await driver.quit()








        res.json({ captcha: isCaptcha, imgUrl })
    } catch (error) {
        console.error(error)
        next(error)
    }

}



export const getLinkedInCaptcha = async (req, res, next) => {
    try {

        let url = ""












        res.json({ image: url, sound: null })
    } catch (error) {
        console.error(error)
        next(error)
    }
}


export const sendLinkedInCaptchaInput = async (req, res, next) => {
    try {

        let driver = await maindriver

        let imageNumber = req.body.imageNumber


        let asdf = await driver.wait(until.elementLocated(By.xpath(`// li[@id="image${imageNumber}"]//a`,))).click()

        let imgUrl = '';
        let isCaptcha = false;

        await driver.sleep(3000)


        let url = await driver.getCurrentUrl()

        if (url.includes('checkpoint')) { //captcha

            isCaptcha = true;
            try {
                let img = await driver.wait(until.elementLocated(By.xpath(`// div[@id="game_challengeItem"]//img`,)))
                imgUrl = await img?.getAttribute('src');
            } catch (error) {
                console.error(error)
            }

        }
        // let lastSelenium = await SeleniumSessionModel.findOne().sort({ createdAt: 'desc' }).lean.exec()

        // let debug = lastSelenium.capabilities.map_["goog:chromeOptions"].debuggerAddress

        // let options = new chrome.Options();
        // // options.addArguments('--headless');
        // options.setPageLoadStrategy(PageLoadStrategy.EAGER)
        // options.addArguments('--disable-gpu');
        // options.addArguments('--window-size=1920,1080');
        // options.debuggerAddress(debug)


        // const chromeDriverPath = path.join(process.cwd(), "chromedriver"); // or wherever you've your geckodriver
        // const serviceBuilder = new ServiceBuilder(chromeDriverPath);



        // let driver = await new Builder()
        //     .forBrowser("chrome")
        //     .setChromeService(serviceBuilder)
        //     .setChromeOptions(options).build()

        console.log(await driver.getCurrentUrl())




        res.json({ message: "testing", isCaptcha, imgUrl })
    } catch (error) {
        console.error(error)
        next(error)
    }

}


export const linkedInSearch = async (req, res, next) => {
    try {

        let totalResults = ''
        let resultsArr = []

        let driver = await maindriver
        //////looking for search filter


        let page = await driver.get("https://www.linkedin.com");


        let searchInput = await driver.wait(until.elementLocated(By.xpath(`//input[@class="search-global-typeahead__input"]`)));
        console.log("SEARCH INPUT FOUND")

        res.status(200).json({ message: 'Processing you can close this window' });


        let campaignObj = await new Campaign({
            ...req.body,
            processing: true
            // totalResults: totalResults, resultsArr: clientsArr, isSearched: true 
        }).save()

        console.log("url:", await driver.getCurrentUrl())
        if (searchInput) {
            /////////searching for search input on linkedin and entering the query sent by user and submiting the input




            await driver.findElement(By.xpath(`//input[@class="search-global-typeahead__input"]`)).sendKeys(`${req.body.searchQuery}`, Key.ENTER)
            ///////////search input filled , now looking for people filter on linkedin
            let filterClick = await driver.wait(until.elementLocated(By.xpath("//button[text()='People']")))
            if (filterClick) {

                console.log("FILTER CLICKED FOUND")
                //////clicking on people filter 
                await driver.findElement(By.xpath("//button[text()='People']")).click()
                /////checking if the page is completely loaded or not 
                let filterResultsVisibleClick = await driver.wait(until.elementLocated(By.xpath(`//div[@class="search-results-container"]//h2[@class="pb2 t-black--light t-14"]`)))
                if (filterResultsVisibleClick) {



                    ///////scrolling the page to bottom because linked in does not load the whole page until its scrolled
                    await driver.executeScript(`window.scrollTo(0, 4500)`)
                    ////////locating all filters button 
                    let allFiltersClick = await driver.wait(until.elementLocated(By.xpath(`// div[@class="relative mr2"]//button[text() = "All filters"]`,)))
                    if (allFiltersClick) {
                        ////////clicking on all filters button
                        await driver.findElement(By.xpath(`// div[@class="relative mr2"]//button[text() = "All filters"]`,)).click()
                        ////////locating company filter
                        let companyButton = await driver.wait(until.elementLocated(By.xpath(`//ul//li//fieldset//h3[text()="Current company"]/following-sibling::div//ul//li[last()]//button`)))
                        if (companyButton) {
                            ////////waiting for the elements to load
                            await driver.sleep(1000)
                            ////////clicking on the company button to reveal text input
                            await driver.findElement(By.xpath(`//ul//li//fieldset//h3[text()="Current company"]/following-sibling::div//ul//li[last()]//button`)).click()
                            ////////clicking on the text input to get it in focus
                            await driver.findElement(By.xpath(`//ul//li//fieldset//h3[text()="Current company"]/following-sibling::div//ul//li[last()]//div[@class="search-reusables__filter-new-value-typeahead"]//div//input`)).click()
                            ////////Entering values in the text input
                            await driver.findElement(By.xpath(`//ul//li//fieldset//h3[text()="Current company"]/following-sibling::div//ul//li[last()]//div[@class="search-reusables__filter-new-value-typeahead"]//div//input`)).sendKeys(req.body.company)
                            ////////waiting for the elements to load
                            await driver.sleep(1000)
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
                            await driver.sleep(1000)
                            ////////clicking on the school button to reveal text input
                            await driver.findElement(By.xpath(`//ul//li//fieldset//h3[text()="School"]/following-sibling::div//ul//li[last()]//button`)).click()
                            ////////clicking on the text input to get it in focus
                            await driver.findElement(By.xpath(`//ul//li//fieldset//h3[text()="School"]/following-sibling::div//ul//li[last()]//div[@class="search-reusables__filter-new-value-typeahead"]//div//input`)).click()
                            ////////Entering values in the text input
                            await driver.findElement(By.xpath(`//ul//li//fieldset//h3[text()="School"]/following-sibling::div//ul//li[last()]//div[@class="search-reusables__filter-new-value-typeahead"]//div//input`)).sendKeys(req.body.school)
                            ////////waiting for the elements to load
                            await driver.sleep(1000)
                            ////////clicking on the text input to get it in focus
                            await driver.findElement(By.xpath(`//ul//li//fieldset//h3[text()="School"]/following-sibling::div//ul//li[last()]//div[@class="search-reusables__filter-new-value-typeahead"]//div//input`)).click()
                            ////////pressing down key to highlight the first result
                            await driver.findElement(By.xpath(`//ul//li//fieldset//h3[text()="School"]/following-sibling::div//ul//li[last()]//div[@class="search-reusables__filter-new-value-typeahead"]//div//input`)).sendKeys(Key.ARROW_DOWN)
                            ////////pressing down enter to select the first result
                            await driver.findElement(By.xpath(`//ul//li//fieldset//h3[text()="School"]/following-sibling::div//ul//li[last()]//div[@class="search-reusables__filter-new-value-typeahead"]//div//input`)).sendKeys(Key.ENTER)
                        }
                        ////////waiting for the elements to load
                        await driver.sleep(1000)
                        ////////locating show results button
                        let showResults = await driver.wait(until.elementLocated(By.xpath(`//button[@data-test-reusables-filters-modal-show-results-button="true" and @aria-label="Apply current filters to show results"]`)))
                        if (showResults) {
                            ////////clicking on show results button
                            await driver.findElement(By.xpath(`//button[@data-test-reusables-filters-modal-show-results-button="true" and @aria-label="Apply current filters to show results"]`)).click()
                        }
                    }


                    ////////waiting for the elements to load
                    await driver.sleep(1000)
                    ////////locating total results div

                    ///////scrolling the page to bottom because linked in does not load the whole page until its scrolled
                    await driver.executeScript(`window.scrollTo(0, 4500)`)

                    // getting total results
                    try {
                        totalResults = await driver.findElement(By.xpath(`//div[@class="search-results-container"]//div//h2[@class="pb2 t-black--light t-14"]`)).getText()
                        console.log("TOTAL RESULTS", totalResults)

                        await Campaign.findByIdAndUpdate(campaignObj._id, { totalResults: totalResults, })
                    } catch (error) {
                        console.error(error)
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

                                    let resultText = await driver.wait(until.elementLocated(By.xpath(`//div[@class="search-results-container"]//div//h2[@class="pb2 t-black--light t-14"]`)))
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
                                await driver.sleep(1000)
                                ////////locating results div
                                let resultElement = await driver.wait(until.elementsLocated(By.xpath(`//ul[@class="reusable-search__entity-result-list list-style-none"]//li//div[@class="entity-result"]//div[@class="entity-result__item"]//div[@class="entity-result__content entity-result__divider pt3 pb3 t-12 t-black--light"]`)))
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
                                ///////scrolling the page to bottom because linked in does not load the whole page until its scrolled
                                await driver.executeScript(`window.scrollTo(0, 4500)`)


                                console.log("SCROLL TO BOTTOM THE ALT3.1 ")
                                ////////waiting for the elements to load
                                await driver.sleep(1000)
                                ////////finding if next button is visible or not
                                let nextbuttonIsValid = await driver.wait(until.elementIsVisible(driver.findElement(By.xpath(`//button[@aria-label="Next"]//span[text()='Next']`))),5000)
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
                        }
                    }
                    catch (err) {

                        console.log("else case")
                        ///////scrolling the page to bottom because linked in does not load the whole page until its scrolled
                        await driver.executeScript(`window.scrollTo(0, 4500)`)

                        console.log("SCROLL TO BOTTOM THE ALT3.2 ")
                        ////////waiting for the elements to load
                        await driver.sleep(1000)

                        try {

                            let resultText = await driver.wait(until.elementLocated(By.xpath(`//div[@class="search-results-container"]//div//h2[@class="pb2 t-black--light t-14"]`)), 5000)
                            if (resultText) {
                                ////////getting value of total results
                                totalResults = await driver.findElement(By.xpath(`//div[@class="search-results-container"]//div//h2[@class="pb2 t-black--light t-14"]`)).getText()
                                console.log("TOTAL RESULTS", totalResults)
                            }
                        } catch (error) {
                            console.error(error)
                        }



                        ////////locating results div
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

                }
            }
        }


        let lengthOfArray = resultsArr.filter(el => el.link && el.link != "").length

        /////not for now 
        for (let j = 0; j < lengthOfArray; j++) {
            try {
                await driver.get(`${resultsArr[j].link}`);
                await driver.sleep(2000)

                let currentPosition = await driver.wait(until.elementLocated(By.xpath(`//div[@class="text-body-medium break-words"]`)), 5000)
                if (currentPosition) {
                    let currentPositionValue = await driver.findElement(By.xpath(`//div[@class="text-body-medium break-words"]`)).getText()
                    resultsArr[j].currentPosition = currentPositionValue
                }

                let location = await driver.wait(until.elementLocated(By.xpath(`//div[@class="pv-text-details__left-panel mt2"]//span`)), 5000)
                if (location) {
                    let locationValue = await driver.findElement(By.xpath(`//div[@class="pv-text-details__left-panel mt2"]//span`)).getText()
                    resultsArr[j].location = locationValue
                }
                let educations = await driver.wait(until.elementLocated(By.xpath(`//section[@class="artdeco-card ember-view relative break-words pb3 mt2 "]//*[contains(text(),"Education")]//ancestor::section[@class="artdeco-card ember-view relative break-words pb3 mt2 "]//ul//li`)))
                if (educations) {
                    let tempEducationArr = []
                    let educationValueArr = await driver.findElements(By.xpath(`//section[@class="artdeco-card ember-view relative break-words pb3 mt2 "]//*[contains(text(),"Education")]//ancestor::section[@class="artdeco-card ember-view relative break-words pb3 mt2 "]//ul//li//div//a//span[@class="mr1 hoverable-link-text t-bold"]//span[@aria-hidden="true"]`))
                    for (let k = 0; k < educationValueArr.length; k++) {
                        let value = await driver.findElement(By.xpath(`(//section[@class="artdeco-card ember-view relative break-words pb3 mt2 "]//*[contains(text(),"Education")]//ancestor::section[@class="artdeco-card ember-view relative break-words pb3 mt2 "]//ul//li//div//a//span[@class="mr1 hoverable-link-text t-bold"])[${k + 1}]//span[@aria-hidden="true"]`)).getText()
                        tempEducationArr.push(value)
                    }
                    resultsArr[j].educationArr = tempEducationArr
                }
                await driver.sleep(1000)
            }
            catch (err) {
                console.error(err);
            }
        }
        // await driver.quit();


        let clientsArr = []
        for (const el of resultsArr) {
            let clientObj
            let clientExistsCheck = await User.findOne({ name: el.name, url: el.url, role: rolesObj?.CLIENT }).exec()
            if (!clientExistsCheck) {
                clientObj = await new User({ ...el, role: rolesObj?.CLIENT }).save()
            }
            else {
                clientObj = await User.findByIdAndUpdate(clientExistsCheck._id, { el, role: rolesObj?.CLIENT }, { new: true }).exec()
            }
            console.log(clientObj)
            clientsArr.push(clientObj)
        }



        if (clientsArr) {
            clientsArr = clientsArr.map(el => ({ clientId: el._id }))
            await Campaign.findByIdAndUpdate(campaignObj._id, { ...req.body, totalResults: totalResults, resultsArr: clientsArr, isSearched: true }).exec()
            if (campaignObj) {
                console.log(campaignObj, "el,campaignObj", clientsArr)
                let leadsArr = await Lead.insertMany([...clientsArr.map(el => ({ clientId: el._id, ...el, campaignId: campaignObj._id }))])
                console.log(leadsArr, "leadsArr")
            }
            let campaignUpdatedObj = await Campaign.findByIdAndUpdate(campaignObj._id, { resultsArr: clientsArr, processing: false }).exec()
        }





    } catch (error) {
        console.error(error)
        next(error)
    }

}


export const linkedInProfileScrapping = async (req, res, next) => {

}


export const forceCloseDriver = async (req, res, next) => {
    try {


    } catch (error) {
        console.error(error)
        next(error)
    }
}



























/* GET users listing. */
export const searchLinkedin = async (req, res, next) => {
    try {
        let existsCheck = await Campaign.findOne({ name: req.body.name }).exec()
        if (existsCheck) {
            throw new Error("Campaign with same name already exists")
        }

        if (!req.body.oneTimeLink) {
            if (!req.body.linkedInAccountId) {
                throw new Error("Please Add Linkedin Account Email")
            }
            if (!req.body.password) {
                throw new Error("Please Add Linkedin Account Password")
            }
        }




        if (!req.body.searchQuery) {
            throw new Error("Please add Search Query")
        }
        if (!req.body.company) {
            throw new Error("Please add company")
        }
        if (!req.body.school) {
            throw new Error("Please add School")
        }



        let options = new chrome.Options();
        options.addArguments('--headless');
        options.setPageLoadStrategy(PageLoadStrategy.EAGER)
        options.addArguments('--disable-gpu');
        options.addArguments('--window-size=1920,1080');


        if (req.body.proxyId) {
            try {

                let proxyObj = await ProxiesModel.findById(req.body.proxyId)
                if (proxyObj) {

                    let proxyAddress = proxyObj.value
                    options.addArguments(`--proxy-server=${proxyAddress}`)
                    console.log('PROXY SET TO ', `--proxy-server=${proxyAddress}`)
                }

            } catch (error) {
                console.error("PROXY ERROR", error)
            }
        }

        const chromeDriverPath = path.join(process.cwd(), "chromedriver"); // or wherever you've your geckodriver
        const serviceBuilder = new ServiceBuilder(chromeDriverPath);


        let driver = await new Builder().forBrowser("chrome")
            .setChromeService(serviceBuilder)

            .setChromeOptions(options).build()
        console.log("DRIVER CREATED")

        let resultsArr = []

        let totalResults = ""

        try {

            await driver.get('http://httpbin.org/ip')


            await driver.sleep(3000)

            let data = await driver.getPageSource()
            console.log(data)

            let page = await driver.get("https://www.linkedin.com");

            console.log("url:", await driver.getCurrentUrl())
            ///////checking if the page is loaded
            if (handleCheckPageLoaded(driver)) {

                // login code start
                if (req.body.oneTimeLink) {
                    let page = await driver.get(req.body.oneTimeLink); // one time login link

                }
                else {


                    console.log("url:", await driver.getCurrentUrl())
                    /////////searching for email/phone field 
                    let accountName = await driver.wait(until.elementsLocated(By.id("session_key")))
                    if (accountName) {
                        /////////searching for email/phone field 
                        await driver.findElement(By.id("session_key")).sendKeys(`${req.body.accountName}`)
                    }
                    /////////searching for password field 
                    let password = await driver.wait(until.elementsLocated(By.id("session_password")))
                    if (password) {
                        /////////entering value for password field 
                        await driver.findElement(By.id("session_password")).sendKeys(`${req.body.password}`)
                    }
                    ///////////searching the login page





                    console.log("url:", await driver.getCurrentUrl())
                    let submitbutton = await driver.wait(until.elementsLocated(By.xpath(`//button[@type="submit" and @class="sign-in-form__submit-button"]`)))
                    if (submitbutton) {
                        ///////////submiting the login page
                        await driver.findElement(By.xpath(`//button[@type="submit" and @class="sign-in-form__submit-button"]`)).click()
                    }

                    // login code end

                    console.log("LOGIN")

                    console.log("url:", await driver.getCurrentUrl())
                }

                ////////waiting for the elements to load
                await driver.sleep(3000)
                console.log("url:", await driver.getCurrentUrl())







                //////looking for search filter
                let searchInput = await driver.wait(until.elementLocated(By.xpath(`//input[@class="search-global-typeahead__input"]`)));
                console.log("SEARCH INPUT FOUND")

                console.log("url:", await driver.getCurrentUrl())
                if (searchInput) {
                    /////////searching for search input on linkedin and entering the query sent by user and submiting the input
                    await driver.findElement(By.xpath(`//input[@class="search-global-typeahead__input"]`)).sendKeys(`${req.body.searchQuery}`, Key.ENTER)
                    ///////////search input filled , now looking for people filter on linkedin
                    let filterClick = await driver.wait(until.elementLocated(By.xpath("//button[text()='People']")))
                    if (filterClick) {

                        console.log("FILTER CLICKED FOUND")
                        //////clicking on people filter 
                        await driver.findElement(By.xpath("//button[text()='People']")).click()
                        /////checking if the page is completely loaded or not 
                        let filterResultsVisibleClick = await driver.wait(until.elementLocated(By.xpath(`//div[@class="search-results-container"]//h2[@class="pb2 t-black--light t-14"]`)))
                        if (filterResultsVisibleClick) {



                            ///////scrolling the page to bottom because linked in does not load the whole page until its scrolled
                            await driver.executeScript(`window.scrollTo(0, 4500)`)
                            ////////locating all filters button 
                            let allFiltersClick = await driver.wait(until.elementLocated(By.xpath(`// div[@class="relative mr2"]//button[text() = "All filters"]`,)))
                            if (allFiltersClick) {
                                ////////clicking on all filters button
                                await driver.findElement(By.xpath(`// div[@class="relative mr2"]//button[text() = "All filters"]`,)).click()
                                ////////locating company filter
                                let companyButton = await driver.wait(until.elementLocated(By.xpath(`//ul//li//fieldset//h3[text()="Current company"]/following-sibling::div//ul//li[last()]//button`)))
                                if (companyButton) {
                                    ////////waiting for the elements to load
                                    await driver.sleep(1000)
                                    ////////clicking on the company button to reveal text input
                                    await driver.findElement(By.xpath(`//ul//li//fieldset//h3[text()="Current company"]/following-sibling::div//ul//li[last()]//button`)).click()
                                    ////////clicking on the text input to get it in focus
                                    await driver.findElement(By.xpath(`//ul//li//fieldset//h3[text()="Current company"]/following-sibling::div//ul//li[last()]//div[@class="search-reusables__filter-new-value-typeahead"]//div//input`)).click()
                                    ////////Entering values in the text input
                                    await driver.findElement(By.xpath(`//ul//li//fieldset//h3[text()="Current company"]/following-sibling::div//ul//li[last()]//div[@class="search-reusables__filter-new-value-typeahead"]//div//input`)).sendKeys(req.body.company)
                                    ////////waiting for the elements to load
                                    await driver.sleep(1000)
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
                                    await driver.sleep(1000)
                                    ////////clicking on the school button to reveal text input
                                    await driver.findElement(By.xpath(`//ul//li//fieldset//h3[text()="School"]/following-sibling::div//ul//li[last()]//button`)).click()
                                    ////////clicking on the text input to get it in focus
                                    await driver.findElement(By.xpath(`//ul//li//fieldset//h3[text()="School"]/following-sibling::div//ul//li[last()]//div[@class="search-reusables__filter-new-value-typeahead"]//div//input`)).click()
                                    ////////Entering values in the text input
                                    await driver.findElement(By.xpath(`//ul//li//fieldset//h3[text()="School"]/following-sibling::div//ul//li[last()]//div[@class="search-reusables__filter-new-value-typeahead"]//div//input`)).sendKeys(req.body.school)
                                    ////////waiting for the elements to load
                                    await driver.sleep(1000)
                                    ////////clicking on the text input to get it in focus
                                    await driver.findElement(By.xpath(`//ul//li//fieldset//h3[text()="School"]/following-sibling::div//ul//li[last()]//div[@class="search-reusables__filter-new-value-typeahead"]//div//input`)).click()
                                    ////////pressing down key to highlight the first result
                                    await driver.findElement(By.xpath(`//ul//li//fieldset//h3[text()="School"]/following-sibling::div//ul//li[last()]//div[@class="search-reusables__filter-new-value-typeahead"]//div//input`)).sendKeys(Key.ARROW_DOWN)
                                    ////////pressing down enter to select the first result
                                    await driver.findElement(By.xpath(`//ul//li//fieldset//h3[text()="School"]/following-sibling::div//ul//li[last()]//div[@class="search-reusables__filter-new-value-typeahead"]//div//input`)).sendKeys(Key.ENTER)
                                }
                                ////////waiting for the elements to load
                                await driver.sleep(1000)
                                ////////locating show results button
                                let showResults = await driver.wait(until.elementLocated(By.xpath(`//button[@data-test-reusables-filters-modal-show-results-button="true" and @aria-label="Apply current filters to show results"]`)))
                                if (showResults) {
                                    ////////clicking on show results button
                                    await driver.findElement(By.xpath(`//button[@data-test-reusables-filters-modal-show-results-button="true" and @aria-label="Apply current filters to show results"]`)).click()
                                }
                            }


                            ////////waiting for the elements to load
                            await driver.sleep(1000)
                            ////////locating total results div

                            ///////scrolling the page to bottom because linked in does not load the whole page until its scrolled
                            await driver.executeScript(`window.scrollTo(0, 4500)`)

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

                                            let resultText = await driver.wait(until.elementLocated(By.xpath(`//div[@class="search-results-container"]//div//h2[@class="pb2 t-black--light t-14"]`)))
                                            if (resultText) {
                                                ////////getting value of total results
                                                totalResults = await driver.findElement(By.xpath(`//div[@class="search-results-container"]//div//h2[@class="pb2 t-black--light t-14"]`)).getText()
                                                console.log("TOTAL RESULTS", totalResults)
                                            }
                                        } catch (error) {
                                            console.error(error)
                                        }

                                        ///////scrolling the page to bottom because linked in does not load the whole page until its scrolled
                                        await driver.executeScript(`window.scrollTo(0, 4500)`)

                                        console.log("SCROLL TO BOTTOM THE ALT")
                                        ////////waiting for the elements to load
                                        await driver.sleep(1000)
                                        ////////locating results div
                                        let resultElement = await driver.wait(until.elementsLocated(By.xpath(`//ul[@class="reusable-search__entity-result-list list-style-none"]//li//div[@class="entity-result"]//div[@class="entity-result__item"]//div[@class="entity-result__content entity-result__divider pt3 pb3 t-12 t-black--light"]`)))
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
                                        ///////scrolling the page to bottom because linked in does not load the whole page until its scrolled
                                        await driver.executeScript(`window.scrollTo(0, 4500)`)


                                        console.log("SCROLL TO BOTTOM THE ALT2 ")
                                        ////////waiting for the elements to load
                                        await driver.sleep(1000)
                                        ////////finding if next button is visible or not
                                        let nextbuttonIsValid = await driver.wait(until.elementIsVisible(driver.findElement(By.xpath(`//button[@aria-label="Next"]//span[text()='Next']`))))
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
                                }
                            }
                            catch (err) {

                                console.log("else case")
                                ///////scrolling the page to bottom because linked in does not load the whole page until its scrolled
                                await driver.executeScript(`window.scrollTo(0, 4500)`)

                                console.log("SCROLL TO BOTTOM THE ALT3.3 ")
                                ////////waiting for the elements to load
                                await driver.sleep(1000)

                                try {

                                    let resultText = await driver.wait(until.elementLocated(By.xpath(`//div[@class="search-results-container"]//div//h2[@class="pb2 t-black--light t-14"]`)))
                                    if (resultText) {
                                        ////////getting value of total results
                                        totalResults = await driver.findElement(By.xpath(`//div[@class="search-results-container"]//div//h2[@class="pb2 t-black--light t-14"]`)).getText()
                                        console.log("TOTAL RESULTS", totalResults)
                                    }
                                } catch (error) {
                                    console.error(error)
                                }



                                ////////locating results div
                                let resultElement = await driver.wait(until.elementsLocated(By.xpath(`//ul[@class="reusable-search__entity-result-list list-style-none"]//li//div[@class="entity-result"]//div[@class="entity-result__item"]//div[@class="entity-result__content entity-result__divider pt3 pb3 t-12 t-black--light"]`)))
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

                        }
                    }
                }
                console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
            } else {
                await driver.navigate().refresh()
                setTimeout(() => {
                    handleCheckPageLoaded(driver)
                }, 1000)
            }
            let lengthOfArray = resultsArr.filter(el => el.link && el.link != "").length

            /////not for now 
            for (let j = 0; j < lengthOfArray; j++) {
                try {
                    await driver.get(`${resultsArr[j].link}`);
                    await driver.sleep(2000)

                    let currentPosition = await driver.wait(until.elementLocated(By.xpath(`//div[@class="text-body-medium break-words"]`)), 5000)
                    if (currentPosition) {
                        let currentPositionValue = await driver.findElement(By.xpath(`//div[@class="text-body-medium break-words"]`)).getText()
                        resultsArr[j].currentPosition = currentPositionValue
                    }

                    let location = await driver.wait(until.elementLocated(By.xpath(`//div[@class="pv-text-details__left-panel mt2"]//span`)), 5000)
                    if (location) {
                        let locationValue = await driver.findElement(By.xpath(`//div[@class="pv-text-details__left-panel mt2"]//span`)).getText()
                        resultsArr[j].location = locationValue
                    }
                    let educations = await driver.wait(until.elementLocated(By.xpath(`//section[@class="artdeco-card ember-view relative break-words pb3 mt2 "]//*[contains(text(),"Education")]//ancestor::section[@class="artdeco-card ember-view relative break-words pb3 mt2 "]//ul//li`)))
                    if (educations) {
                        let tempEducationArr = []
                        let educationValueArr = await driver.findElements(By.xpath(`//section[@class="artdeco-card ember-view relative break-words pb3 mt2 "]//*[contains(text(),"Education")]//ancestor::section[@class="artdeco-card ember-view relative break-words pb3 mt2 "]//ul//li//div//a//span[@class="mr1 hoverable-link-text t-bold"]//span[@aria-hidden="true"]`))
                        for (let k = 0; k < educationValueArr.length; k++) {
                            let value = await driver.findElement(By.xpath(`(//section[@class="artdeco-card ember-view relative break-words pb3 mt2 "]//*[contains(text(),"Education")]//ancestor::section[@class="artdeco-card ember-view relative break-words pb3 mt2 "]//ul//li//div//a//span[@class="mr1 hoverable-link-text t-bold"])[${k + 1}]//span[@aria-hidden="true"]`)).getText()
                            tempEducationArr.push(value)
                        }
                        resultsArr[j].educationArr = tempEducationArr
                    }
                    await driver.sleep(1000)
                }
                catch (err) {
                    console.error(err);
                }
            }
            await driver.quit();


            let clientsArr = []
            for (const el of resultsArr) {
                let clientObj
                let clientExistsCheck = await User.findOne({ name: el.name, url: el.url, role: rolesObj?.CLIENT }).exec()
                if (!clientExistsCheck) {
                    clientObj = await new User({ ...el, role: rolesObj?.CLIENT }).save()
                }
                else {
                    clientObj = await User.findByIdAndUpdate(clientExistsCheck._id, { el, role: rolesObj?.CLIENT }, { new: true }).exec()
                }
                console.log(clientObj)
                clientsArr.push(clientObj)
            }



            if (clientsArr) {
                clientsArr = clientsArr.map(el => ({ clientId: el._id }))
                let campaignObj = await new Campaign({ ...req.body, totalResults: totalResults, resultsArr: clientsArr, isSearched: true }).save()
                if (campaignObj) {
                    console.log(campaignObj, "el,campaignObj", clientsArr)
                    let leadsArr = await Lead.insertMany([...clientsArr.map(el => ({ clientId: el._id, ...el, campaignId: campaignObj._id }))])
                    console.log(leadsArr, "leadsArr")
                }
                let campaignUpdatedObj = await Campaign.findByIdAndUpdate(campaignObj._id, { resultsArr: clientsArr }).exec()
            }
            res.status(200).json({ message: 'Data found', data: { ...req.body, totalResults: totalResults, resultsArr: resultsArr }, success: true });
        }

        catch (err) {
            console.error(err)
            next(err)
        }
    }
    catch (err) {
        console.error(err)
        next(err)
    }

};









const handleCheckPageLoaded = async (driver) => {


    let accountName = await driver.wait(until.elementsLocated(By.id("session_key")))
    if (accountName) {
        return true
    }
    else {
        return false
    }
}


export const getPastCampaign = async (req, res, next) => {
    try {
        let SearchResultArr = await Campaign.find().sort({ "createdAt": -1 }).exec()


        res.status(200).json({ message: "Search Results", data: SearchResultArr, success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};




export const getPastCampaignById = async (req, res, next) => {
    try {
        let SearchResultObj = await Campaign.findById(req.params.id).lean().exec()
        if (SearchResultObj) {
            let clientArr = await User.find({ _id: { $in: [...SearchResultObj?.resultsArr.map(el => el.clientId)] } }).exec()
            SearchResultObj.resultsArr = clientArr
        }
        res.status(200).json({ message: "Search Result object", data: SearchResultObj, success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};


export const addScheduledCampaign = async (req, res, next) => {
    try {
        if (!req.body.linkedInAccountId) {
            throw new Error("Please Add Linkedin Account Email")
        }
        if (!req.body.password) {
            throw new Error("Please Add Linkedin Account Password")
        }
        if (!req.body.searchQuery) {
            throw new Error("Please add Search Query")
        }
        if (!req.body.company) {
            throw new Error("Please add company")
        }
        if (!req.body.school) {
            throw new Error("Please add School")
        }


        let existsCheck = await Campaign.findOne({ name: req.body.name }).exec()
        if (existsCheck) {
            throw new Error("Campaign with same name already exists")
        }

        await new CampaignModel(req.body).save()
        res.status(200).json({ message: "Campaign Scheduled", success: true });
    } catch (error) {
        console.error(error)
        next(error)
    }
}





// start();




                        //div[@class="pvs-header__left-container--stack"]//span[text()="Education" and @aria-hidden="true"]
















                        // if (req.body.page > 1) {
                        //     for (let j = 0; j < req.body.page - 1; j++) {
                        //         //////to be looped if number of pages is more than 2
                        //         ////////clicking on the next page
                        //         let filterResultsVisibleClick = await driver.wait(until.elementLocated(By.xpath(`//div[@class="search-results-container"]//h2[@class="pb2 t-black--light t-14"]`)))
                        //         if (filterResultsVisibleClick) {
                        //             ///////scrolling the page to bottom because linked in does not load the whole page until its scrolled
                        //             await driver.executeScript(`window.scrollTo(0, 4500)`)
                        //             let nextButton = await driver.wait(until.elementLocated(By.xpath(`//button[@aria-label="Next"]//span[text()='Next']`)))
                        //             if (nextButton) {
                        //                 await driver.findElement(By.xpath(`//button[@aria-label="Next"]//span[text()='Next']`))?.click()
                        //             }
                        //         }
                        //     }
                        // }
                        // else {
                        //     let array = await driver.wait(until.elementLocated(By.xpath('//ul[@class="reusable-search__entity-result-list list-style-none"]//li[@class="reusable-search__result-container"]//span[@class="entity-result__title-line entity-result__title-line--2-lines"]//span//a[@class="app-aware-link "]')))
                        //     console.log(array, "array")
                        //     // let array2 = await driver.wait(until.elementLocated(By.xpath('//ul[@class="reusable-search__entity-result-list list-style-none"]//li[@class="reusable-search__result-container"]//span[@class="entity-result__title-line entity-result__title-line--2-lines"]//span//a[@class="app-aware-link "]//span//span[0]')))
                        //     // console.log(array, array2, "array,array2")
                        //     // for (const ele of array) {
                        //     //     console.log(ele, "array element")
                        //     //     let obj = {}
                        //     //     if (ele) {
                        //     //         let link = await ele.getAttribute("href")
                        //     //         if (link) {
                        //     //             obj.link = link
                        //     //             finalLinkArr.push(link)
                        //     //         }
                        //     //         let name = await ele.findElement(By.xpath("//span//span[0]"))
                        //     //         if (name) {
                        //     //             obj.name = name.split("\n")[0]
                        //     //             finalNameArr.push(name.split("\n")[0])
                        //     //         }
                        //     //     }
                        //     //     resultsArr.push(obj);
                        //     // }
                        //     // for (const elx of array2) {
                        //     //     if (elx) {
                        //     //         let name = await elx.getText()
                        //     //         if (name) {
                        //     //             finalNameArr.push(name.split("\n")[0])
                        //     //         }
                        //     //     }
                        //     // }
                        //     // console.log(resultsArr, "navlink &")
                        //     console.log("asd")
                        // }



 // console.log(typeof (`${resultsArr[j /].link}`), "link")
        // let finalNameArr = []
        // let finalLinkArr = []
        // let finalArr = []


        // // await driver.wait(until.elementLocated(By.id('foo')), 5000);

        // let searchInput = await driver.wait(until.elementsLocated(By.xpath(`//input[@class="search-global-typeahead__input"]`)))

        // console.log(searchInput, "search input")
        // setTimeout(async () => {
        //     let searchButton = await driver.findElement(By.xpath(`//input[@class="search-global-typeahead__input"]`)).sendKeys(`${req.body.searchQuery}`)
        //     let searchButtonClick = await driver.findElement(By.xpath(`//input[@class="search-global-typeahead__input"]`)).sendKeys(Key.ENTER)
        //     setTimeout(async () => {
        //         let filterClick = await driver.findElement(By.xpath("//button[text()='People']")).click()
        //         setTimeout(async () => {

        //             // for (let j = 0; j <= req.body.page; j++) {


        //             setTimeout(async () => {
        //                 // console.log(`//button[@aria-label="Next"]`, "url")
        //                 // await driver.executeScript(`window.scrollTo(0, 2500)`)
        //                 // setTimeout(async () => {
        //                 //     try {
        //                 //         let pagebutton = await driver.findElement(By.xpath(`//button[@aria-label="Next"]//span[text()='Next']`))?.click()
        //                 //         console.log(pagebutton, "pagebutton")
        //                 //     }
        //                 //     catch (err) {
        //                 //         console.error(err)
        //                 //     }
        //                 //     await driver.executeScript(`window.scrollTo(0, 2500)`)
        //                 //     console.log(j, "j")

        //                 // }, 2000)

        //                 setTimeout(async () => {
        //                     try {
        //                         let array = await driver.findElements(By.xpath('//ul[@class="reusable-search__entity-result-list list-style-none"]//li[@class="reusable-search__result-container"]//span[@class="entity-result__title-line entity-result__title-line--2-lines"]//span//a[@class="app-aware-link "]'))
        //                         let array2 = await driver.findElements(By.xpath('//ul[@class="reusable-search__entity-result-list list-style-none"]//li[@class="reusable-search__result-container "]//span[@class="entity-result__title-line entity-result__title-line--2-lines"]//span//a[@class="app-aware-link "]//span//span[0]'))

        //                         for (const ele of array) {
        //                             let obj = {}
        //                             if (ele) {
        //                                 let link = await ele.getAttribute("href")
        //                                 if (link) {
        //                                     obj.link = link
        //                                     finalLinkArr.push(link)
        //                                 }
        //                                 let name = await ele.getText()
        //                                 if (name) {

        //                                     obj.name = name
        //                                     finalNameArr.push(name.split("\n")[0])
        //                                 }
        //                             }
        //                         }
        //                         for (const elx of array2) {
        //                             if (elx) {

        //                                 let name = await elx.getText()
        //                                 if (name) {
        //                                     finalNameArr.push(name.split("\n")[0])
        //                                 }
        //                             }
        //                         }

        //                         console.log("asd")
        //                     }
        //                     catch (err) {
        //                         console.error(err)
        //                     }

        //                 }, 3000)


        //             }, 1500)





        //             // let data = {
        //             //     finalNameArr: finalNameArr,
        //             //     finalLinkArr: finalLinkArr,
        //             //     at: `${new Date().getHours()}:${new Date().getMinutes()}`
        //             // }

        //             // let fileName = `books${new Date().getHours()}${new Date().getMinutes()}.txt`
        //             // fs.writeFile(`${fileName}`, JSON.stringify(data), (err) => {
        //             //     if (err)
        //             //         console.log(err);
        //             //     else {
        //             //         console.log("File written successfully\n");
        //             //         console.log("The written has the following contents:");
        //             //         // console.log(fs.readFileSync(`${fileName}`, "utf8"));
        //             //     }

        //             //     console.log(finalNameArr, finalLinkArr)
        //             // })





        //             // finalNameArr = finalNameArr.filter(el => !`${el}`.toLowerCase().includes("view"))
        //             // finalLinkArr = finalLinkArr.filter(el => !`${el}`.toLowerCase().includes("search"))
        //             // }
        //             for (let i = 0; i <= finalNameArr.length - 1; i++) {
        //                 let obj = {
        //                     name: finalNameArr[i],
        //                     url: finalLinkArr[i]
        //                 }

        //                 finalArr.push(obj)

        //             }


        //             let saved = await new Campaign({ ...req.body, resultsArr: finalArr }).save()
        //             // await driver.quit();
        //             console.log(finalNameArr, finalLinkArr)
        //         }, 1500)
        //     }, 3000)

        // }, 3000)