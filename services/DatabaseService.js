import mongoose from "mongoose";
import { createClient } from "redis";
import { appConfig } from "../config/app.config";

export class DatabaseService {
    static async initializeMongoDB() {
        try {
            mongoose.set('strictQuery', false);

            await mongoose.connect(appConfig.mongodb.uri, appConfig.mongodb.options);
            console.log("Connected to MongoDB at", appConfig.mongodb.uri);
        } catch (error) {
            console.error("MongoDB connection error:", error);
            throw error;
        }
    }

    static async initializeRedis() {
        try {
            const client = createClient({
                url: `redis://${appConfig.redis.host}:${appConfig.redis.port}`
            });

            client.on("connect", () => {
                console.log("Redis connected");
                client.set("isFree", "true")
                    .catch(err => console.error("Error setting Redis key:", err));
            });

            client.on("error", (err) => {
                console.error("Redis connection error:", err);
            });

            await client.connect();
            return client;
        } catch (error) {
            console.error("Redis initialization error:", error);
            throw error;
        }
    }
}