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

const app = express();
mongoose.connect(CONFIG.MONGOURI, { useNewUrlParser: true, useUnifiedTopology: true }, (err) => {
    if (err) {
        console.log(err);
    } else {
        console.log("connected to db at " + CONFIG.MONGOURI);
    }
});

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/fabric", fabricRouter);
app.use("/product", productRouter);
app.use(errorHandler);

export default app;
