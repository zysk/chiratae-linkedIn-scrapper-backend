import { driver as maindriver, redisClient } from "../../app";
import Campaign from "../../models/Campaign.model";
import { generalModelStatuses } from "../utils/Constants";
import { sendMail } from "../email/nodeMailer";

import { By, Key, until } from "selenium-webdriver";
import Lead from "../../models/leads.model";
import User from "../../models/user.model";
// const chrome = require('/usr/bin/chromedriver');  ///////chrome for server
// const chrome = require('./chromedriver').path;
import { rolesObj } from "../utils/Constants";
import { seleniumErrorHandler } from "./seleniumErrorHandler";
import { generateRandomNumbers } from "../utils";
import LinkedInAccountsModel from "../../models/LinkedInAccounts.model";

/**
 * Processes scheduled LinkedIn search campaigns
 * @param {Date} beforeDate - Optional date to process campaigns before
 *
 * Business Logic:
 * 1. Finds campaigns scheduled for today or before specified date
 * 2. For each campaign:
 *    - Performs LinkedIn search using campaign criteria
 *    - Processes search results
 *    - Creates/updates user records with rating
 *    - Creates lead records linking users to campaign
 *    - Updates campaign with results
 */
export const getScheduledCampaignsForToday = async (beforeDate = null) => {
    try {
        await redisClient.set("isBusy", "true");

        const todayEnd = beforeDate ? new Date(beforeDate) : new Date();
        if (!beforeDate) {
            todayEnd.setHours(23, 59, 59, 59);
        }

        const campaignsArr = await Campaign.find({
            status: generalModelStatuses.CREATED,
            scheduled: true,
            scheduleDate: { $lte: todayEnd }
        }).exec();
    } catch (err) {
        asd;
        console.error(err);
    }
};
