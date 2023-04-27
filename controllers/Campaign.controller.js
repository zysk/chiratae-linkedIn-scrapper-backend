import { Builder, By, Key, until } from 'selenium-webdriver';
import Campaign from '../models/Campaign.model';
import Lead from '../models/leads.model';
import User from '../models/user.model';
// const chrome = require('/usr/bin/chromedriver');  ///////chrome for server
// const chrome = require('./chromedriver').path;
import path from 'path';
import chrome, { ServiceBuilder } from 'selenium-webdriver/chrome';
import { PageLoadStrategy } from 'selenium-webdriver/lib/capabilities';
import { cronFunc, driver as maindriver, redisClient } from '../app';
import { CalculateRating } from '../helpers/CalculateRating';
import { rolesObj } from '../helpers/Constants';
import { sendCustomMailToSavanta, sendMail } from '../helpers/nodeMailer';
import { getScheduledCampaignsForToday } from '../helpers/ScheduledCampaigns';
import { searchLinkedInFn } from '../helpers/SearchLinkedInFn';
import { seleniumErrorHandler } from '../helpers/seleniumErrorHandler';
import { randomBoolean, randomIntFromInterval } from '../helpers/utils';
import CampaignModel from '../models/Campaign.model';
import ProxiesModel from '../models/Proxies.model';
import UserLogs from '../models/userLogs.model';





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


export const handleLogoutAndLoginAnotherAccount = async (req, res, next) => {
    try {
        let driver = await maindriver
        driver.sleep(1000)

        let logoutButton = await driver.wait(until.elementsLocated(By.xpath(`//button[@aria-expanded="false" and @class="global-nav__primary-link artdeco-dropdown__trigger artdeco-dropdown__trigger--placement-bottom ember-view" and @type="button"]`)))
        if (logoutButton) {
            await driver.findElement(By.xpath(`//button[@aria-expanded="false" and @class="global-nav__primary-link artdeco-dropdown__trigger artdeco-dropdown__trigger--placement-bottom ember-view" and @type="button"]`)).click()


            driver.sleep(1000)

            let signOutButtonLocate = await driver.wait(until.elementsLocated(By.linkText("Sign Out")))
            if (signOutButtonLocate) {
                let signOutButton = await driver.findElement(By.linkText("Sign Out")).click();
                try {
                    let signOutButtonModal = await driver.wait(until.elementsLocated(By.xpath(`//button[@class="full-width mt4 artdeco-button artdeco-button--muted artdeco-button--2 artdeco-button--secondary ember-view"]`)), 8000);
                    if (signOutButtonModal) {
                        driver.findElement(By.xpath(`//button[@class="full-width mt4 artdeco-button artdeco-button--muted artdeco-button--2 artdeco-button--secondary ember-view"]`)).click();
                        let url = await driver.getCurrentUrl()

                        if (url.includes('home')) {
                            res.json({ isLogin: false, message: 'logged out successfully' });
                            return
                        }
                        else if (url.includes('feed')) {
                            res.json({ isLogin: true, message: 'logged out successfully' });
                            return
                        }
                    }
                    else {
                        let url = await driver.getCurrentUrl()

                        if (url.includes('home')) {
                            res.json({ isLogin: false, message: 'logged out successfully' });
                            return
                        }
                        else if (url.includes('feed')) {
                            res.json({ isLogin: true, message: 'logged out successfully' });
                            return
                        }
                    }
                }
                catch (err) {
                    let url = await driver.getCurrentUrl()

                    if (url.includes('home')) {
                        res.json({ isLogin: false, message: 'logged out successfully' });
                        return
                    }
                    else if (url.includes('feed')) {
                        res.json({ isLogin: true, message: 'logged out successfully' });
                        return
                    }
                }
            }
            else {
                let url = await driver.getCurrentUrl()

                if (url.includes('home')) {
                    res.json({ isLogin: false, message: 'logged out successfully' });
                    return
                }
                else if (url.includes('feed')) {
                    res.json({ isLogin: true, message: 'logged out successfully' });
                    return
                }
            }

            // await driver.wait(until.elementsLocated(By.xpath(``))).click()
        }

    } catch (error) {
        console.error(error)
    }
}

export const continueScheduled = async (req, res, next) => {
    try {

        getScheduledCampaignsForToday(req.query.endDate)

        res.json({ message: "Schedule Continued" })

    } catch (error) {
        console.error(error)
        next(error)
    }
}

export const checkLinkedInLoginFunc = async () => {
    let driver = await maindriver
    let isLogin = false
    let url = await driver.getCurrentUrl()
    console.log("url:", url)
    // console.timeEnd("label1")
    if (url.includes('feed') || url.includes('/in/') || url.includes('/search/') || url.includes('/results/')) {
        isLogin = true
    }
    return isLogin
}

export const checkLinkedInLogin = async (req, res, next) => {
    try {

        let isLogin = await checkLinkedInLoginFunc()

        res.json({
            isLogin, message: isLogin ? "Already logged in proceeding to search Note : Another search might be going on , your search will be taken after all the pending searches are done" : "Login Required"
        })

    } catch (error) {
        console.error(error)
    }
}

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


            driver.sleep(1000)
            console.log("url:", await driver.getCurrentUrl())



            // check login






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

                    console.log("logging IN")




                    console.log("url:", await driver.getCurrentUrl())
                    let submitbutton = await driver.wait(until.elementsLocated(By.xpath(`//button[@type="submit"]`)))
                    console.log("SUBMIT BUTTION", submitbutton)
                    if (submitbutton) {
                        ///////////submiting the login page
                        await driver.findElement(By.xpath(`//button[@type="submit"]`)).click()
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








        res.json({ captcha: isCaptcha, imgUrl, })

    } catch (error) {
        console.error(error)
        next(error)
    }

}


export const addCampaignToQueue = async (req, res, next) => {
    try {


        let campaignObj = await new Campaign({
            ...req.body,
            processing: false,
            // status: "PROCESSING"
            // totalResults: totalResults, resultsArr: clientsArr, isSearched: true 
        }).save()



        res.json({ message: "Your campaign is created and placed at the end of the queue" })

    } catch (error) {
        console.error(error)
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
        let source = await driver.getPageSource()
        console.log(url, "CURRENT URL")
        driver.takeScreenshot().then(
            function (image, err) {
                let basicFilePath = `./public/uploads/checkCaptcha_${new Date().getTime()}___${encodeURIComponent(url)}___`
                require('fs').writeFile(`${basicFilePath}.png`, image, 'base64', function (err) {
                    console.log(err);
                });
                require('fs').writeFile(`${basicFilePath}.source.txt`, source, function (err) {
                    console.log(err);
                });
            }
        );

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


        searchLinkedInFn(driver, req, res, next, searchInput, page, totalResults)

        // res.status(200).json({ message: 'Results found', success: true });

    } catch (error) {
        console.error(error)
        next(error)
    }

}


export const linkedInProfileScrapping = async () => {
    await redisClient.set("isFree", "false")
    let loggedIn = await checkLinkedInLoginFunc()
    if (!loggedIn) {
        await sendMail(
            // [
            "mulahajedu@jollyfree.com",
            // "joel.green@ebslon.com",
            // "joelgreen737@gmail.com",
            // "jnjasgreem@gmail.com",
            // ]
        )
        await redisClient.set("isFree", "true")
        throw new Error('not logged in')
    }

    let userArr = await User.find({ role: rolesObj?.CLIENT, searchCompleted: false }).limit(50).lean().exec()

    if (!userArr.length) {
        return true
    }



    let driver = await maindriver


    for (let j = 0; j < userArr.length; j++) {
        try {
            let campaignObj = await Campaign.findById(userArr[j].campaignId).exec()

            console.log("LinkedIn", j + 1, userArr.length)
            await driver.get(`${userArr[j].link}`);
            await driver.sleep(randomIntFromInterval(1000, 15000))


            if (randomBoolean()) {
                await driver.executeScript(`window.scrollTo(0, ${randomIntFromInterval(100, 1000)})`)
            }


            let currentUrl = await driver.getCurrentUrl()
            try {

                let currentPosition = await driver.wait(until.elementLocated(By.xpath(`//div[@class="text-body-medium break-words"]`)), 5000)
                if (currentPosition) {
                    let currentPositionValue = await driver.findElement(By.xpath(`//div[@class="text-body-medium break-words"]`)).getText()
                    userArr[j].currentPosition = currentPositionValue
                }
            }
            catch (err) {
                seleniumErrorHandler()
            }

            try {
                let location = await driver.wait(until.elementLocated(By.xpath(`//div[@class="pv-text-details__left-panel mt2"]//span`)), 5000)
                if (location) {
                    let locationValue = await driver.findElement(By.xpath(`//div[@class="pv-text-details__left-panel mt2"]//span`)).getText()
                    userArr[j].location = locationValue
                }
            }
            catch (err) {
                seleniumErrorHandler()
            }

            try {
                let contactInfoLinkExists = await driver.wait(until.elementLocated(By.xpath(`//a[text()="Contact info"]`)), 5000)
                if (contactInfoLinkExists) {
                    await driver.get(`${currentUrl}/overlay/contact-info/`);
                    await driver.sleep(randomIntFromInterval(1000, 15000))
                    let contactInfoArr = [];

                    ////// //h3
                    try {
                        let contactInfoElementsExists = await driver.wait(until.elementLocated(By.xpath(`//section[@class="pv-profile-section pv-contact-info artdeco-container-card"]//div[@class="pv-profile-section__section-info section-info"]//section`)), 5000)
                        if (contactInfoElementsExists) {
                            let contactInfoElements = await driver.findElements(By.xpath(`//section[@class="pv-profile-section pv-contact-info artdeco-container-card"]//div[@class="pv-profile-section__section-info section-info"]//section`))
                            await driver.sleep(randomIntFromInterval(1000, 15000))

                            console.log(contactInfoElements, contactInfoElements.length, "contactInfoElements")
                            let obj = {}
                            for (let q = 0; q < contactInfoElements.length; q++) {

                                obj = {
                                    heading: "",
                                    dataArr: []
                                }

                                console.log(q, "k")
                                try {
                                    let contactInfoHeading = await driver.findElement(By.xpath(`(//section[@class="pv-profile-section pv-contact-info artdeco-container-card"]//div[@class="pv-profile-section__section-info section-info"]//section//h3)[${q + 1}]`), 5000)
                                    if (contactInfoHeading) {
                                        obj.heading = await driver.findElement(By.xpath(`(//section[@class="pv-profile-section pv-contact-info artdeco-container-card"]//div[@class="pv-profile-section__section-info section-info"]//section//h3)[${q + 1}]`)).getText()
                                        console.log(obj.heading, "heading")
                                    }
                                }
                                catch (err) {
                                    console.error(err, "could not find contact info h3")
                                    seleniumErrorHandler()
                                }

                                try {
                                    let contactInfoElementsExists = await driver.wait(until.elementsLocated(By.xpath(`(//section[@class="pv-profile-section pv-contact-info artdeco-container-card"]//div[@class="pv-profile-section__section-info section-info"]//section)[${q + 1}]//a`)), 5000)
                                    if (contactInfoElementsExists) {
                                        let contactInfourlList = await driver.findElements(By.xpath(`(//section[@class="pv-profile-section pv-contact-info artdeco-container-card"]//div[@class="pv-profile-section__section-info section-info"]//section)[${q + 1}]//a`))
                                        if (contactInfourlList && contactInfourlList.length > 0) {
                                            for (let p = 0; p < contactInfourlList.length; p++) {
                                                let contactLinkElement = await driver.findElement(By.xpath(`((//section[@class="pv-profile-section pv-contact-info artdeco-container-card"]//div[@class="pv-profile-section__section-info section-info"]//section)[${q + 1}]//a)[${p + 1}]`)).getText()

                                                console.log(contactLinkElement, "contactLinkElement")

                                                obj.dataArr.push(contactLinkElement);
                                            }
                                        }
                                    }
                                }
                                catch (err) {
                                    console.log("inside, catch", err)
                                    try {
                                        let contactInfoListExists = await driver.wait(until.elementsLocated(By.xpath(`((//section[@class="pv-profile-section pv-contact-info artdeco-container-card"]//div[@class="pv-profile-section__section-info section-info"]//section)[${q + 1}]/ul/li)`)), 5000)
                                        if (contactInfoListExists) {

                                            let contactInfoList = await driver.findElements(By.xpath(`((//section[@class="pv-profile-section pv-contact-info artdeco-container-card"]//div[@class="pv-profile-section__section-info section-info"]//section)[${q + 1}]/ul/li)`))
                                            if (contactInfoList) {
                                                for (let p = 0; p < contactInfoList.length; p++) {
                                                    let contactInfoListValue = await driver.findElement(By.xpath(`(((//section[@class="pv-profile-section pv-contact-info artdeco-container-card"]//div[@class="pv-profile-section__section-info section-info"]//section)[${q + 1}]/ul/li)[${p + 1}]/span)[1]`)).getText()
                                                    console.log(contactInfoListValue, "contactInfoListValue")

                                                    obj.dataArr.push(contactInfoListValue);
                                                }
                                            }
                                            else {
                                                console.error("Not found link")
                                            }
                                        }
                                    }
                                    catch (err) {
                                        let contactInfoList = await driver.findElements(By.xpath(`((//section[@class="pv-profile-section pv-contact-info artdeco-container-card"]//div[@class="pv-profile-section__section-info section-info"]//section)[${q + 1}])//div/span`))
                                        if (contactInfoList) {
                                            let contactInfoListValue = await driver.findElement(By.xpath(`((//section[@class="pv-profile-section pv-contact-info artdeco-container-card"]//div[@class="pv-profile-section__section-info section-info"]//section)[${q + 1}])//div/span`)).getText()

                                            obj.dataArr.push(contactInfoListValue);
                                        }
                                        console.log(err)
                                    }

                                    console.error(err, "could not find contact info h3")
                                }
                                console.log(obj, "obj")
                                contactInfoArr.push(obj)
                            }

                        }
                        else {
                            console.log("not found")
                        }

                    }
                    catch (err) {
                        console.error(err, "could not find contact info section tags")
                        seleniumErrorHandler()
                    }
                    console.log(contactInfoArr, "contactInfoArr")
                    userArr[j].contactInfoArr = contactInfoArr
                }

            }
            catch (err) {
                console.error(err)
                seleniumErrorHandler()
            }


            try {

                let tempEducationArr = []
                await driver.get(`${currentUrl}/details/education/`);
                await driver.sleep(randomIntFromInterval(1000, 15000))


                //ul/li[@class="pvs-list__paged-list-item artdeco-list__item pvs-list__item--line-separated pvs-list__item--one-column"]
                try {
                    if (randomBoolean()) {
                        await driver.executeScript(`window.scrollTo(0, ${randomIntFromInterval(100, 1000)})`)
                    }
                    let tempEducationArrExists = await driver.wait(until.elementLocated(By.xpath(`(//ul/li[@class="pvs-list__paged-list-item artdeco-list__item pvs-list__item--line-separated pvs-list__item--one-column"])`)), 5000)
                    if (tempEducationArrExists) {
                        let internalEducationarr = await driver.findElements(By.xpath(`(//ul/li[@class="pvs-list__paged-list-item artdeco-list__item pvs-list__item--line-separated pvs-list__item--one-column"])`))

                        console.log(internalEducationarr, "internnaleducation arr")
                        for (let l = 0; l < internalEducationarr.length; l++) {

                            let schoolName = ""
                            let schoolDetail = ""
                            let year = ""
                            try {
                                schoolName = await driver.findElement(By.xpath(`(//ul/li[@class="pvs-list__paged-list-item artdeco-list__item pvs-list__item--line-separated pvs-list__item--one-column"])[${l + 1}]/div/div//div[@class="display-flex flex-row justify-space-between"]/a/div//span[@aria-hidden="true"]`)).getText()
                            }
                            catch (err) {
                                console.error(err)
                            }
                            try {
                                schoolDetail = await driver.findElement(By.xpath(`(//ul/li[@class="pvs-list__paged-list-item artdeco-list__item pvs-list__item--line-separated pvs-list__item--one-column"])[${l + 1}]/div/div//div[@class="display-flex flex-row justify-space-between"]/a//span[@class="t-14 t-normal"]//span[@aria-hidden="true"]`)).getText()
                            }
                            catch (err) {
                                console.error(err)
                            }
                            try {
                                year = await driver.findElement(By.xpath(`(//ul/li[@class="pvs-list__paged-list-item artdeco-list__item pvs-list__item--line-separated pvs-list__item--one-column"])[${l + 1}]/div/div//div[@class="display-flex flex-row justify-space-between"]/a//span[@class="t-14 t-normal t-black--light"]//span[@aria-hidden="true"]`)).getText()
                            }
                            catch (err) {
                                console.error(err)
                            }

                            let obj = {
                                schoolName,
                                schoolDetail,
                                year,
                            }
                            console.log(obj, "education Obj")
                            tempEducationArr.push(obj)
                        }

                    }

                }
                catch (err) {
                    console.error(err)
                    seleniumErrorHandler()
                }

                userArr[j].educationArr = tempEducationArr
                console.log(tempEducationArr, "tempEducationArr")






            }
            catch (err) {
                console.error(err)
                seleniumErrorHandler()
            }
            console.log("getExperience", `${userArr[j].link}/details/experience/`)
            await driver.get(`${currentUrl}/details/experience/`);
            await driver.sleep(randomIntFromInterval(1000, 15000))
            try {
                let experienceFound = await driver.wait(until.elementLocated(By.xpath(`//main//section/div[@class="pvs-list__container"]/div/div/ul[@class="pvs-list "]/li/div/div/div[@class="display-flex flex-column full-width align-self-center"]`)), 5000)

                if (experienceFound) {
                    // console.log(randomBoolean(), randomIntFromInterval(100, 5000), "randomBoolean()randomBoolean()randomBoolean()randomBoolean()randomBoolean()randomBoolean()randomBoolean()randomBoolean()randomBoolean()randomBoolean()randomBoolean()randomBoolean()randomBoolean()randomBoolean()randomBoolean()randomBoolean()randomBoolean()randomBoolean()randomBoolean()randomBoolean()randomBoolean()randomBoolean()randomBoolean()randomBoolean()randomBoolean()randomBoolean()randomBoolean()randomBoolean()randomBoolean()randomBoolean()randomBoolean()randomBoolean()randomBoolean()randomBoolean()randomBoolean()randomBoolean()randomBoolean()randomBoolean()randomBoolean()randomBoolean()randomBoolean()randomBoolean()randomBoolean()randomBoolean()randomBoolean()randomBoolean()randomBoolean()randomBoolean()randomBoolean()randomBoolean()randomBoolean()randomBoolean()randomBoolean()randomBoolean()randomBoolean()randomBoolean()randomBoolean()randomBoolean()randomBoolean()randomBoolean()randomBoolean()randomBoolean()randomBoolean()randomBoolean()randomBoolean()randomBoolean()randomBoolean()randomBoolean()randomBoolean()randomBoolean()randomBoolean()")
                    if (randomBoolean()) {
                        await driver.executeScript(`window.scrollTo(0, ${randomIntFromInterval(100, 1000)})`)
                    }
                    let experienceArr = await driver.findElements(By.xpath(`//main//section/div[@class="pvs-list__container"]/div/div/ul[@class="pvs-list "]/li/div/div/div[@class="display-flex flex-column full-width align-self-center"]`))
                    console.log(experienceArr, "experienceArr", experienceArr.length)
                    let experienceValueArr = []

                    if (experienceArr && experienceArr.length > 0) {
                        for (let k = 0; k < experienceArr.length; k++) {
                            let companyvalue = ""
                            let value = ""
                            let year = ""
                            try {
                                let checkElementHasAnchorTag = await driver.findElement(By.xpath(`(//main//section/div[@class="pvs-list__container"]/div/div/ul[@class="pvs-list "]/li//div/div/div[@class="display-flex flex-column full-width align-self-center"])[${k + 1}]/div[@class="display-flex flex-row justify-space-between"]/a`), 5000);
                                if (checkElementHasAnchorTag) {
                                    console.log("inside if")
                                    try {
                                        companyvalue = await driver.findElement(By.xpath(`(//main//section/div[@class="pvs-list__container"]/div/div/ul[@class="pvs-list "]/li/div/div/div[@class="display-flex flex-column full-width align-self-center"])[${k + 1}]/div[@class="display-flex flex-row justify-space-between"]/a/div//span[@aria-hidden="true"]`)).getText();
                                    }
                                    catch (error) {
                                        try {
                                            companyvalue = await driver.findElement(By.xpath(`(//main//section/div[@class="pvs-list__container"]/div/div/ul[@class="pvs-list "]/li/div/div/div[@class="display-flex flex-column full-width align-self-center"])[${k + 1}]/div[@class="display-flex flex-row justify-space-between"]/div/div/span/span[@aria-hidden="true"]`)).getText();
                                        }
                                        catch (error) {
                                            console.error(error)
                                        }
                                        console.error(error)
                                    }
                                    try {
                                        value = await driver.findElement(By.xpath(`(//main//section/div[@class="pvs-list__container"]/div/div/ul[@class="pvs-list "]/li/div/div/div[@class="display-flex flex-column full-width align-self-center"])[${k + 1}]/div[@class="display-flex flex-row justify-space-between"]/a/div/span[@class="t-14 t-normal"]/span[@aria-hidden="true"]`)).getText();
                                    }
                                    catch (error) {
                                        value = await driver.findElement(By.xpath(`((//main//section/div[@class="pvs-list__container"]/div/div/ul[@class="pvs-list "]/li/div/div/div[@class="display-flex flex-column full-width align-self-center"])[${k + 1}]/div[@class="display-flex flex-row justify-space-between"]/a/span/span[@aria-hidden="true"])[1]`)).getText();
                                        console.error(error)
                                    }
                                    try {
                                        year = await driver.findElement(By.xpath(`((//main//section/div[@class="pvs-list__container"]/div/div/ul[@class="pvs-list "]/li/div/div/div[@class="display-flex flex-column full-width align-self-center"])[${k + 1}]/div[@class="display-flex flex-row justify-space-between"]/a/div/span[@class="t-14 t-normal t-black--light"]/span[@aria-hidden="true"])[1]`)).getText();
                                    } catch (error) {
                                        try {
                                            year = await driver.findElement(By.xpath(`((//main//section/div[@class="pvs-list__container"]/div/div/ul[@class="pvs-list "]/li/div/div/div[@class="display-flex flex-column full-width align-self-center"])[${k + 1}]//a/span[@class="t-14 t-normal"])[1]`)).getText();
                                        } catch (error) {
                                            console.error(error)
                                        }

                                        console.error(error)
                                    }
                                }
                            }
                            catch (err) {
                                console.log("inside else", err);
                                try {
                                    companyvalue = await driver.findElement(By.xpath(`(//main//section/div[@class="pvs-list__container"]/div/div/ul[@class="pvs-list "]/li/div/div/div[@class="display-flex flex-column full-width align-self-center"])[${k + 1}]/div[@class="display-flex flex-row justify-space-between"]/div/div//span[@aria-hidden="true"]`)).getText();
                                }
                                catch (error) {
                                    console.error(error)
                                }
                                try {
                                    value = await driver.findElement(By.xpath(`(//main//section/div[@class="pvs-list__container"]/div/div/ul[@class="pvs-list "]/li/div/div/div[@class="display-flex flex-column full-width align-self-center"])[${k + 1}]/div[@class="display-flex flex-row justify-space-between"]/div/span[@class="t-14 t-normal"]/span[@aria-hidden="true"]`)).getText();
                                }
                                catch (error) {
                                    console.error(error)
                                }
                                try {
                                    year = await driver.findElement(By.xpath(`((//main//section/div[@class="pvs-list__container"]/div/div/ul[@class="pvs-list "]/li/div/div/div[@class="display-flex flex-column full-width align-self-center"])[${k + 1}]/div[@class="display-flex flex-row justify-space-between"]/div/span[@class="t-14 t-normal t-black--light"]/span[@aria-hidden="true"])[1]`)).getText();
                                } catch (error) {

                                    console.error(error)
                                }
                            }
                            experienceValueArr.push({ company: companyvalue, companyDetail: value, year: year });
                            console.log({ company: companyvalue, companyDetail: value, year: year }, "{ company: companyvalue, companyDetail: value, year: year }");
                        }
                    }
                    userArr[j].experienceArr = experienceValueArr
                    console.log(experienceValueArr, "experienceValueArr")


                    // let obj = {
                    //     ...clientExistsCheck,
                    //     campaignName: campaignObj?.name,
                    //     rating: rating,
                    //     campanignId: campaignObj?._id,
                    //     searchQuery: campaignObj?.searchQuery,
                    //     accountName: campaignObj?.accountName,
                    //     searchedSchool: campaignObj?.school,
                    //     searchedCompany: campaignObj?.company,
                    //     totalResults: campaignObj?.totalResults,
                    // }
                    // delete obj._id
                    // console.log(obj)
                    // let temp = await new PreviousLeads(obj).save()
                    // clientExistsCheck
                }
                console.log(JSON.stringify(userArr[j], null, 2), "temp")
            }
            catch (err) {
                console.error(err)
            }
            let rating = "";
            rating = CalculateRating(userArr[j]);
            await User.findByIdAndUpdate(userArr[j]._id, { ...userArr[j], role: rolesObj?.CLIENT, rating, searchCompleted: true }).exec()
            await Lead.updateMany({ clientId: `${usersArr[j]._id}` }, { rating }).exec()
            //         let rating = "";
            //         rating = CalculateRating(resultsArr[j])
            //         // console.log("ratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingrating", rating, "ratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingratingrating")
            //         ////////////adding client for campaigns
            console.log(userArr, "userArr", JSON.stringify(userArr, null, 2))
        }


        catch (error) {
            await redisClient.set("isFree", "true")

            throw error
            // console.error(error)
            // next(error)
        }
    }
    await redisClient.set("isFree", "true")
}

export const linkedInProfileScrappingReq = async (req, res, next) => {
    try {
        res.status(200).json({ message: 'Data scrapping has begun', success: true });
        cronFunc()
    } catch (error) {
        next(error)
    }
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


            await driver.sleep(randomIntFromInterval(1000, 15000))

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
                    let submitbutton = await driver.wait(until.elementsLocated(By.xpath(`//button[@type="submit""]`)))
                    if (submitbutton) {
                        ///////////submiting the login page
                        await driver.findElement(By.xpath(`//button[@type="submit"]`)).click()
                    }

                    // login code end

                    console.log("LOGIN")

                    console.log("url:", await driver.getCurrentUrl())
                }

                ////////waiting for the elements to load
                await driver.sleep(randomIntFromInterval(1000, 15000))
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

                        console.log("FILTER 6")
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
                                    await driver.sleep(randomIntFromInterval(1000, 15000))
                                    ////////clicking on the company button to reveal text input
                                    await driver.findElement(By.xpath(`//ul//li//fieldset//h3[text()="Current company"]/following-sibling::div//ul//li[last()]//button`)).click()
                                    ////////clicking on the text input to get it in focus
                                    await driver.findElement(By.xpath(`//ul//li//fieldset//h3[text()="Current company"]/following-sibling::div//ul//li[last()]//div[@class="search-reusables__filter-new-value-typeahead"]//div//input`)).click()
                                    ////////Entering values in the text input
                                    await driver.findElement(By.xpath(`//ul//li//fieldset//h3[text()="Current company"]/following-sibling::div//ul//li[last()]//div[@class="search-reusables__filter-new-value-typeahead"]//div//input`)).sendKeys(req.body.company)
                                    ////////waiting for the elements to load
                                    await driver.sleep(randomIntFromInterval(1000, 15000))
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
                                    await driver.sleep(randomIntFromInterval(1000, 15000))
                                    ////////clicking on the school button to reveal text input
                                    await driver.findElement(By.xpath(`//ul//li//fieldset//h3[text()="School"]/following-sibling::div//ul//li[last()]//button`)).click()
                                    ////////clicking on the text input to get it in focus
                                    await driver.sleep(randomIntFromInterval(1000, 15000))
                                    await driver.findElement(By.xpath(`//ul//li//fieldset//h3[text()="School"]/following-sibling::div//ul//li[last()]//div[@class="search-reusables__filter-new-value-typeahead"]//div//input`)).click()
                                    ////////Entering values in the text input
                                    await driver.sleep(randomIntFromInterval(1000, 15000))
                                    await driver.findElement(By.xpath(`//ul//li//fieldset//h3[text()="School"]/following-sibling::div//ul//li[last()]//div[@class="search-reusables__filter-new-value-typeahead"]//div//input`)).sendKeys(req.body.school)
                                    ////////waiting for the elements to load
                                    await driver.sleep(randomIntFromInterval(1000, 15000))
                                    ////////clicking on the text input to get it in focus
                                    await driver.findElement(By.xpath(`//ul//li//fieldset//h3[text()="School"]/following-sibling::div//ul//li[last()]//div[@class="search-reusables__filter-new-value-typeahead"]//div//input`)).click()
                                    ////////pressing down key to highlight the first result
                                    await driver.sleep(randomIntFromInterval(1000, 15000))
                                    await driver.findElement(By.xpath(`//ul//li//fieldset//h3[text()="School"]/following-sibling::div//ul//li[last()]//div[@class="search-reusables__filter-new-value-typeahead"]//div//input`)).sendKeys(Key.ARROW_DOWN)
                                    ////////pressing down enter to select the first result
                                    await driver.sleep(randomIntFromInterval(1000, 15000))
                                    await driver.findElement(By.xpath(`//ul//li//fieldset//h3[text()="School"]/following-sibling::div//ul//li[last()]//div[@class="search-reusables__filter-new-value-typeahead"]//div//input`)).sendKeys(Key.ENTER)
                                }
                                ////////waiting for the elements to load
                                await driver.sleep(randomIntFromInterval(1000, 15000))
                                ////////locating show results button
                                let showResults = await driver.wait(until.elementLocated(By.xpath(`//button[@data-test-reusables-filters-modal-show-results-button="true" and @aria-label="Apply current filters to show results"]`)))
                                if (showResults) {
                                    ////////clicking on show results button
                                    await driver.findElement(By.xpath(`//button[@data-test-reusables-filters-modal-show-results-button="true" and @aria-label="Apply current filters to show results"]`)).click()
                                }
                            }


                            ////////waiting for the elements to load
                            await driver.sleep(randomIntFromInterval(1000, 15000))
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

                                            console.log("FILTER 7")
                                            let resultText = await driver.wait(until.elementLocated(By.xpath(`//div[@class="search-results-container"]//h2[@class="pb2 t-black--light t-14"]`)))
                                            if (resultText) {
                                                ////////getting value of total results

                                                console.log("FILTER 8")
                                                totalResults = await driver.findElement(By.xpath(`//div[@class="search-results-container"]//h2[@class="pb2 t-black--light t-14"]`)).getText()
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
                                await driver.sleep(randomIntFromInterval(1000, 15000))

                                try {

                                    console.log("FILTER 9")
                                    let resultText = await driver.wait(until.elementLocated(By.xpath(`//div[@class="search-results-container"]//h2[@class="pb2 t-black--light t-14"]`)))
                                    if (resultText) {
                                        ////////getting value of total results

                                        console.log("FILTER 10")
                                        totalResults = await driver.findElement(By.xpath(`//div[@class="search-results-container"]//h2[@class="pb2 t-black--light t-14"]`)).getText()
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
                    console.log(lengthOfArray[j].link, "lengthOfArray[j].link")
                    await driver.get(`${lengthOfArray[j].link}`);
                    await driver.sleep(randomIntFromInterval(1000, 15000))

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
                    await driver.sleep(randomIntFromInterval(1000, 15000))
                }
                catch (err) {
                    console.error(err);
                }
            }


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
                await new UserLogs({ ...el, role: rolesObj?.CLIENT }).save()
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
        }

        catch (err) {
            console.error(err)
            next(err)
        }
        res.status(200).json({ message: 'Data found', data: { ...req.body, totalResults: totalResults, resultsArr: resultsArr }, success: true });
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
            let clientArr = await User.find({ _id: { $in: [...SearchResultObj?.resultsArr.map(el => el.clientId)] } }).lean().exec()

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



export const checkRatingForClient = async (req, res, next) => {
    try {
        let clientObj = await User.findById(req.params.id).exec()

        let rating = CalculateRating(clientObj)
        console.log(rating)
        res.status(200).json({ message: "rating", data: rating, success: true });
    } catch (error) {
        console.error(error)
        next(error)
    }
}




export const sendCampaignToSevanta = async (req, res, next) => {
    try {

        let leadObj = await Lead.findById(req.params.id).exec()

        let userObj = await User.findById(leadObj.clientId).exec()

        let websiteTxt = ""

        if (userObj?.contactInfoArr && userObj?.contactInfoArr.length > 0 && userObj?.contactInfoArr?.some(el => `${el.heading}`.toLowerCase().includes("website"))) {
            let temp = contactInfoArr?.find(el => `${el.heading}`.toLowerCase().includes("website"))
            websiteTxt = temp.dataArr.reduce((acc, el) => acc + el, "");
        }
        let comments = userObj?.contactInfoArr && userObj?.contactInfoArr.length > 0 && userObj?.contactInfoArr.reduce((acc, el, index) => acc + `${el?.heading}: ${el.dataArr.reduce((acc2, ele) => acc2 + ele, "")}`, "")


        let obj = `
            Description:  Current Position - ${userObj?.currentPosition}\n 
            Education - ${userObj?.educationArr && userObj?.educationArr.length > 0 && userObj?.educationArr.reduce((acc, el, index) => acc + `${el?.schoolName},${el?.year} ${(index == (userObj?.educationArr?.length - 1)) ? "" : ","}`, "")} \n
            Experience - ${userObj?.experienceArr && userObj?.experienceArr.length > 0 && userObj?.experienceArr.reduce((acc, el, index) => acc + `${el?.company},${el?.year} ${(index == (userObj?.educationArr?.length - 1)) ? "" : ","}`, "")}\n
            Priority: ${leadObj?.rating}\n
            Comments: Details - ${comments}\n
            SourceNotes: Created from linkedin, profile link is ${userObj?.link}\n
            Website: ${websiteTxt}`

        let email = `chiratae+${userObj?.name ? userObj?.name : ""}@mydeal8ow.com`

        console.log(userObj.mailSettingsObj, "userObj.mailSettingsObj")


        if (
            !userObj.mailSettingsObj?.mailHost ||
            userObj.mailSettingsObj?.mailHost == "" ||
            userObj.mailSettingsObj?.mailPort == "" ||
            userObj.mailSettingsObj?.mailUserName == "" ||
            userObj.mailSettingsObj?.mailUserPassword == "" ||
            userObj.mailSettingsObj?.mailEncryption == "" ||
            userObj.mailSettingsObj?.mailService == ""
        ) {
            throw new Error("Please enter your email setting form in your profile section")
        }




        await sendCustomMailToSavanta(email, userObj?.mailSettingsObj, `Deal Creation for savanta ${userObj?.name}`, obj)





        res.status(200).json({ message: "rating", data: rating, success: true });
    } catch (error) {
        console.error(error)
        next(error)
    }
}
