import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import logger from "morgan";
import path from "path";
import { CONFIG } from "./helpers/Config";
import { errorHandler } from "./helpers/ErrorHandler";
//routes
import campaignRouter from "./routes/Campaign.routes";
import usersRouter from "./routes/users.routes";
import linkedInAccountRouter from "./routes/LinkedInAccounts.routes";
import proxiesRouter from "./routes/Proxies.routes";
import leadRouter from "./routes/Lead.routes";
import leadlogsRouter from "./routes/LeadLogs.routes";
import leadCommentRouter from "./routes/LeadComment.routes";
import { Builder, By, Key, until, getAttribute, Window } from 'selenium-webdriver';
// const chrome = require('/usr/bin/chromedriver');  ///////chrome for server
// const chrome = require('./chromedriver').path;
import chrome, { ServiceBuilder } from 'selenium-webdriver/chrome';
import { PageLoadStrategy } from 'selenium-webdriver/lib/capabilities';
import { getScheduledCampaignsForToday } from "./helpers/ScheduledCampaigns";
import leadStatusRouter from "./routes/LeadStatus.routes";



const schedule = require('node-schedule');

const app = express();
app.use(cors());
mongoose.connect(CONFIG.MONGOURI, { useNewUrlParser: true, useUnifiedTopology: true }, (err) => {
    if (err) {
        console.log(err);
    } else {
        console.log("connected to db at " + CONFIG.MONGOURI);
    }
});
// mongoose.set('debug', true)
app.use(logger("dev"));

app.use(express.json({ limit: "100mb" })); // parses the incoming json requests
app.use(express.urlencoded({ extended: false, limit: "100mb", parameterLimit: 10000000 }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/users", usersRouter);
app.use("/campaign", campaignRouter);
app.use("/lead", leadRouter);
app.use("/leadStatus", leadStatusRouter);
app.use("/linkedInAccount", linkedInAccountRouter);
app.use("/proxies", proxiesRouter);
app.use("/leadlogs", leadlogsRouter);
app.use("/leadComments", leadCommentRouter);

app.use(errorHandler);

const job = schedule.scheduleJob('0 23 * * *', function () {
    // const job = schedule.scheduleJob('0 23 * * 1-7', function () {
    getScheduledCampaignsForToday()


    console.log("At 23:00 on every day-of-week from Monday through Sunday.")

});
/**
 * Selenium Setup
 */
let options = new chrome.Options();
options.addArguments('--headless');
options.setPageLoadStrategy(PageLoadStrategy.EAGER)
options.addArguments('--disable-gpu');
options.addArguments('--window-size=1920,1080');

const chromeDriverPath = path.join(process.cwd(), "chromedriver"); // or wherever you've your geckodriver
const serviceBuilder = new ServiceBuilder(chromeDriverPath);

export const driver = new Promise((resolve, reject) => {
    resolve(new Builder()
        .forBrowser("chrome")
        .setChromeService(serviceBuilder)
        .setChromeOptions(options).build())


})


export default app;