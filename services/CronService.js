import schedule from "node-schedule";
import { appConfig } from "../config/app.config";
import { CampaignController } from "../controllers/Campaign.controller";
import { Campaign } from "../models/Campaign.model";
import { generalModelStatuses } from "../constants/general.constants";

export class CronService {
    constructor() {
        this.setupCampaignScheduler();
        this.setupAccountRotation();
        this.setupMaintenance();
    }

    setupCampaignScheduler() {
        schedule.scheduleJob(appConfig.cron.schedule, async () => {
            if (!appConfig.cron.enabled) {
                console.log(
                    `Cron is disabled. Checking at ${new Date().toLocaleString('en-IN', {
                        timeZone: process.env.TZ,
                        timeZoneName: 'short',
                        hour12: true
                    })}`
                );
                return;
            }

            console.log(
                `Executing cron job at ${new Date().toLocaleString('en-IN', {
                    timeZone: process.env.TZ,
                    timeZoneName: 'short',
                    hour12: true
                })}`
            );

            await this.processPendingCampaigns();
        });
    }

    setupAccountRotation() {
        // Implementation for account rotation
    }

    setupMaintenance() {
        // Implementation for maintenance tasks
    }

    async processPendingCampaigns() {
        const campaigns = await Campaign.find({
            status: generalModelStatuses.CREATED,
            scheduleDate: { $lte: new Date() }
        });

        for (const campaign of campaigns) {
            await CampaignController.processCampaignResults(campaign._id);
        }
    }
}