import path from "path";
import { PageLoadStrategy } from "selenium-webdriver/lib/capabilities";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: "./.env" });

export const appConfig = {
    // Core settings
    port: process.env.PORT || 3000,
    mongoUri: process.env.MONGOURI,
    jwtSecret: process.env.JWT_ACCESS_TOKEN_SECRET,

    // CORS settings
    cors: {
        enabled: true,
        options: {
            // Add CORS options here
        }
    },

    // Database settings
    mongodb: {
        uri: process.env.MONGOURI || "mongodb://localhost:27017/your-db",
        options: {
            useNewUrlParser: true,
            useUnifiedTopology: true
        }
    },

    // Redis settings
    redis: {
        host: process.env.REDIS_HOST || "localhost",
        port: process.env.REDIS_PORT || 6379
    },

    // Selenium settings
    selenium: {
        chrome: {
            options: [
                "--no-sandbox",
                "--disable-gpu",
                "--remote-allow-origins=*",
                "--window-size=1920,1080"
            ],
            headless: process.env.NODE_ENV === "prod" ? ["--headless=new"] : [],
            pageLoadStrategy: PageLoadStrategy.EAGER,
            driverPath: path.join(process.cwd(), "chromedriver")
        }
    },

    // Cron settings
    cron: {
        enabled: process.env.ENABLE_CRON === "true",
        schedule: "0 0 * * *" // Midnight every day
    }
};