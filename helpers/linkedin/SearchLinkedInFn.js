import { By, Key, until } from "selenium-webdriver";
import mongoose from "mongoose";
import Campaign from "../../models/Campaign.model";
import Lead from "../../models/leads.model";
import User from "../../models/user.model";
import PreviousLeads from "../../models/previousLeads.model";
import UserLogs from "../../models/userLogs.model";
import LinkedInAccountsModel from "../../models/LinkedInAccounts.model";
import { generalModelStatuses, rolesObj } from "../utils/Constants";
import { seleniumErrorHandler } from "./seleniumErrorHandler";
import { randomIntFromInterval } from "../utils/utils";
import { sendMail } from "../email/nodeMailer";
import { getLinkedInDriver } from "../../services/SeleniumService";
import { checkLinkedInLoginFunc } from "../../controllers/Campaign.controller";

/**
 * Performs LinkedIn search and saves results to database
 * @param {RedisClient} redisClientParam - Redis client for managing search state
 *
 * Business Logic:
 * 1. Searches LinkedIn using campaign criteria
 * 2. For each result:
 *    - Extracts name and profile URL
 *    - Checks if user already exists in database
 *    - Creates or updates user record
 *    - Creates lead record linking user to campaign
 *    - Logs search history
 * 3. Updates campaign with search results
 */
export const searchLinkedInFn = async (redisClientParam) => {
    await redisClientParam.set("isFree", "false");

    // Process each search result
    for (const result of resultsArr) {
        try {
            const clientExistsCheck = await User.findOne({
                name: new RegExp(`^${result.name}$`),
                url: new RegExp(`^${result.url}$`),
                role: rolesObj?.CLIENT
            }).lean().exec();

            let clientObj;
            if (!clientExistsCheck) {
                // Create new user record
                clientObj = await new User({
                    ...result,
                    role: rolesObj?.CLIENT,
                    campaignId: campaignObj?._id
                }).save();

                // Create lead record
                await new Lead({
                    clientId: clientObj._id,
                    campaignId: campaignObj._id,
                    isSearched: true
                }).save();
            } else {
                // Save search history
                const searchHistory = {
                    ...clientExistsCheck,
                    campaignName: campaignObj?.name,
                    campanignId: campaignObj?._id,
                    searchQuery: campaignObj?.searchQuery,
                    accountName: campaignObj?.accountName,
                    searchedSchool: campaignObj?.school,
                    searchedCompany: campaignObj?.company,
                    totalResults: campaignObj?.totalResults,
                };
                delete searchHistory._id;
                await new PreviousLeads(searchHistory).save();
            }
        } catch (err) {
            console.error(err);
        }
    }
};
