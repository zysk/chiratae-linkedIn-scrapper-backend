import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import logger from "morgan";
import path from "path";
import { CONFIG } from "./helpers/Config";
import { errorHandler } from "./helpers/ErrorHandler";
import campaignRouter from "./routes/Campaign.routes";
import leadRouter from "./routes/Lead.routes";
import leadCommentRouter from "./routes/LeadComment.routes";
import leadlogsRouter from "./routes/LeadLogs.routes";
import linkedInAccountRouter from "./routes/LinkedInAccounts.routes";
import proxiesRouter from "./routes/Proxies.routes";
import usersRouter from "./routes/users.routes";
// const chrome = require('/usr/bin/chromedriver');  ///////chrome for server
// const chrome = require('./chromedriver').path;
import { Builder } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome";
import { PageLoadStrategy } from "selenium-webdriver/lib/capabilities";
import { linkedInProfileScrapping } from "./controllers/Campaign.controller";
import { searchLinkedInFn } from "./helpers/SearchLinkedInFn";
import CampaignModel from "./models/Campaign.model";
import customemailRouter from "./routes/customemail.router";
import emailSettingsRouter from "./routes/EmailSettings.routes";
import leadStatusRouter from "./routes/LeadStatus.routes";
import { generalModelStatuses } from "./helpers/Constants";
const redis = require("redis");
const schedule = require("node-schedule");

const app = express();
app.use(cors());
// app.use(logger("dev"));

mongoose.connect(CONFIG.MONGOURI, { useNewUrlParser: true, useUnifiedTopology: true }, (err) => {
    if (err) {
        console.log(err);
    } else {
        console.log("Connected to db at " + CONFIG.MONGOURI);
    }
});
// mongoose.set("debug", true)

const redisClient = redis.createClient();

redisClient.on("connect", () => {
    console.log("Redis connected");
    redisClient.set("isFree", "true", (err) => (err ? console.error("Error setting key in Redis:", err) : console.log("Key set successfully in Redis")));
});

redisClient.on("error", (err) => console.error("Redis connection error:", err));
redisClient.connect();

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
app.use("/emailSettings", emailSettingsRouter);
app.use("/customemail", customemailRouter);

app.use(errorHandler);
const job = schedule.scheduleJob("*/10 * * * *", function () {
    // console.log(`Cron ran at: ${Date.now()}`);
    // const job = schedule.scheduleJob('*/10 * * * *', function () {
    // const job = schedule.scheduleJob('0 0 * * *', function () {
    // const job = schedule.scheduleJob('0 6,18 * * *', function () {
    // getScheduledCampaignsForToday()
    // if (cronRan) {
    //     cronRan = false;
    //     cronFunc();
    // }
    // // console.log("At 06:00 and 18:00 on every day-of-week from Sunday through Saturday.")
});

export const cronFunc = async () => {
    try {
        let isFree = await redisClient.get("isFree");
        isFree = isFree == "true";
        // console.log(isFree, "isFree")
        if (isFree) {
            let noUsersLeft = false;
            let noCampaignsLeft = false;

            try {
                noUsersLeft = await linkedInProfileScrapping(redisClient);
                console.log("noUsersLeft", noUsersLeft);
            } catch (error) {
                console.error("linkedInProfileScrapping error =>>", error);
            }

            if (noUsersLeft) {
                try {
                    noCampaignsLeft = await searchLinkedInFn(redisClient);
                    console.log("noCampaignsLeft", noCampaignsLeft);
                } catch (error) {
                    console.error("searchLinkedInFn error =>>", error);
                }
            }

            if (noCampaignsLeft) {
                // reset users and campaign
                try {
                    await CampaignModel.updateMany(
                        {},
                        {
                            status: generalModelStatuses.CREATED,
                            isSearched: false,
                            processing: false,
                            $inc: { timesRun: 1 }
                        }
                    );
                    console.log("Search completed >>>>>>>>>>>>>>>>>>>>>>");
                } catch (error) {
                    console.error("campaign update many error =>>", error);
                }
            }
        }
    } catch (error) {
        console.error("ERROR IN CRON FUNC", error);
    }
};
// sendCustomMail()
// app.use()

/**
 * Selenium Setup
 */
const options = new chrome.Options();
options.addArguments("--no-sandbox");
if (process.env.NODE_ENV == "prod") {
	options.addArguments("--headless=new");
}
options.setPageLoadStrategy(PageLoadStrategy.EAGER)
options.addArguments('--disable-gpu');
options.addArguments("--remote-allow-origins=*");
options.addArguments('--window-size=1920,1080');

const chromeDriverPath = path.join(process.cwd(), "chromedriver"); // or wherever you've your geckodriver
const serviceBuilder = new chrome.ServiceBuilder(chromeDriverPath);

export const driver = new Promise((resolve, reject) => {
    resolve(new Builder().forBrowser("chrome").setChromeService(serviceBuilder).setChromeOptions(options).build());
});

export default app;
