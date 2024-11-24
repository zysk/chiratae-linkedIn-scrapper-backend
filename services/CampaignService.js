import mongoose from "mongoose";
import { LinkedInService } from "./LinkedInService";
import Campaign from "../models/Campaign.model";
import User from "../models/user.model";
import Lead from "../models/leads.model";
import { rolesObj } from "../helpers/utils/Constants";
import { CampaignError } from "../helpers/utils/ErrorHandler";

export class CampaignService {
    constructor(driver, redisClient) {
        this.linkedInService = new LinkedInService(driver);
        this.redisClient = redisClient;
    }

    async processAllPendingCampaigns() {
        const pendingCampaigns = await Campaign.find({
            status: "CREATED",
            isSearched: false,
            processing: false
        });

        for (const campaign of pendingCampaigns) {
            await this.processCampaign(campaign);
        }
    }

    async processCampaign(campaign) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Update campaign status
            await Campaign.findByIdAndUpdate(
                campaign._id,
                { processing: true },
                { session }
            );

            // Perform LinkedIn search
            const searchResults = await this.linkedInService.searchPeople(
                campaign.searchQuery,
                {
                    company: campaign.company,
                    pastCompany: campaign.pastCompany,
                    school: campaign.school
                }
            );

            // Process results
            await this.processSearchResults(campaign, searchResults, session);

            // Mark campaign as complete
            await Campaign.findByIdAndUpdate(
                campaign._id,
                {
                    processing: false,
                    isSearched: true,
                    status: "COMPLETED",
                    $inc: { timesRun: 1 }
                },
                { session }
            );

            await session.commitTransaction();

        } catch (error) {
            await session.abortTransaction();

            await Campaign.findByIdAndUpdate(campaign._id, {
                processing: false,
                status: "FAILED",
                error: error.message
            });

            throw new CampaignError(
                `Campaign ${campaign._id} processing failed: ${error.message}`
            );
        } finally {
            session.endSession();
        }
    }

    async processSearchResults(campaign, results, session) {
        const processedResults = [];

        for (const result of results) {
            try {
                const processedResult = await this.processSearchResult(
                    campaign,
                    result,
                    session
                );
                processedResults.push(processedResult);
            } catch (error) {
                console.error(
                    `Failed to process result for campaign ${campaign._id}:`,
                    error
                );
            }
        }

        return processedResults;
    }

    async processSearchResult(campaign, result, session) {
        // Find or create user
        let user = await User.findOne({
            name: result.name,
            url: result.url,
            role: rolesObj.CLIENT
        }).session(session);

        if (!user) {
            user = await new User({
                ...result,
                role: rolesObj.CLIENT,
                campaignId: campaign._id
            }).save({ session });
        } else {
            user = await User.findByIdAndUpdate(
                user._id,
                {
                    ...result,
                    role: rolesObj.CLIENT,
                    campaignId: campaign._id
                },
                { new: true, session }
            );
        }

        // Create lead
        const lead = await new Lead({
            clientId: user._id,
            campaignId: campaign._id,
            isSearched: true
        }).save({ session });

        // Update campaign
        await Campaign.findByIdAndUpdate(
            campaign._id,
            { $push: { resultsArr: { clientId: user._id } } },
            { session }
        );

        return { user, lead };
    }
}