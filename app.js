import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";
import { errorHandler } from "./helpers/ErrorHandler";
import { CONFIG } from "./helpers/Config";
import mongoose from "mongoose";

//routes
import usersRouter from "./routes/users.routes";
import indexRouter from "./routes/index.routes";
import fabricRouter from "./routes/Fabric.routes";
import productRouter from "./routes/product.routes";
import fabricOrderRouter from "./routes/FabricOrder.routes";
import customerMeasurementRouter from "./routes/CustomerMeasurement.routes";
import MeasurementProductRouter from "./routes/MeasurementProduct.routes";

import cors from "cors";
const app = express();
app.use(cors());
mongoose.connect(CONFIG.MONGOURI, { useNewUrlParser: true, useUnifiedTopology: true }, (err) => {
    if (err) {
        console.log(err);
    } else {
        console.log("connected to db at " + CONFIG.MONGOURI);
    }
});

app.use(logger("dev"));

app.use(express.json({ limit: "100mb" })); // parses the incoming json requests
app.use(express.urlencoded({ extended: false, limit: "100mb", parameterLimit: 10000000 }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/fabric", fabricRouter);
app.use("/fabricOrder", fabricOrderRouter);

app.use("/product", productRouter);
app.use("/customerMeasurement", customerMeasurementRouter);
app.use("/MeasurementProduct", MeasurementProductRouter);

app.use(errorHandler);

export default app;
