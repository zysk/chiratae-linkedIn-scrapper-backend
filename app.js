import express from "express";
import path from "path";
import { appConfig } from "./config/app.config";
import { DatabaseService } from "./services/DatabaseService";
import { seleniumService } from "./services/SeleniumService";
import { CampaignService } from "./services/CampaignService";
import { CronService } from "./services/CronService";
import { setupMiddleware } from "./middlewares/setup.middleware";
import { setupRoutes } from "./routes/setup.routes";
import { errorHandler } from "./helpers/utils/ErrorHandler";

class Application {
    constructor() {
        this.app = express();
        this.services = {};
    }

    async initialize() {
        // Initialize services
        await this.initializeServices();

        // Setup middleware
        setupMiddleware(this.app);

        // Setup routes
        setupRoutes(this.app);

        // Error handling
        this.app.use(errorHandler);

        return this.app;
    }

    async initializeServices() {
        // Initialize database connections
        await DatabaseService.initializeMongoDB();
        this.services.redis = await DatabaseService.initializeRedis();

        // Initialize Selenium
        this.services.driver = await seleniumService.initialize();

        // Initialize Campaign service
        this.services.campaignService = new CampaignService();

        // Initialize Cron service
        this.services.cronService = new CronService();
    }
}

const appInstance = new Application();
export default appInstance;
