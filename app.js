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
mongoose.set('debug', true)
app.use(logger("dev"));

app.use(express.json({ limit: "100mb" })); // parses the incoming json requests
app.use(express.urlencoded({ extended: false, limit: "100mb", parameterLimit: 10000000 }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/users", usersRouter);
app.use("/campaign", campaignRouter);
app.use("/leadStatus", leadStatusRouter);
app.use("/linkedInAccount", linkedInAccountRouter);
app.use("/proxies", proxiesRouter);

app.use(errorHandler);

const job = schedule.scheduleJob('0 0 * * *', function () {
    console.log('The answer to life, the universe, and everything!');
});

export default app;