import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import logger from "morgan";
import path from "path";
import { appConfig } from "../config/app.config";

export const setupMiddleware = (app) => {
    // CORS
    if (appConfig.cors.enabled) {
        app.use("*", cors(appConfig.cors.options));
    }

    // Logging
    if (process.env.NODE_ENV !== "production") {
        app.use(logger("dev"));
    }

    // Request parsing
    app.use(express.json({ limit: "100mb" }));
    app.use(express.urlencoded({
        extended: false,
        limit: "100mb",
        parameterLimit: 10000000
    }));

    // Cookies
    app.use(cookieParser());

    // Static files
    app.use(express.static(path.join(__dirname, "../public")));
};