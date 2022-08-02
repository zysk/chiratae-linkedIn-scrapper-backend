import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";
import { errorHandler } from "./helpers/ErrorHandler";
import { CONFIG } from "./helpers/Config";
import mongoose from "mongoose";

// //routes
import usersRouter from "./routes/users.routes";
import indexRouter from "./routes/index.routes";

import category from "./routes/category.routes";
import product from "./routes/product.routes";
import brand from "./routes/brand.routes";
import attribute from "./routes/attribute.routes";
import attributeValue from "./routes/attributeValue.routes";
import tag from "./routes/tag.routes";
import userCart from "./routes/userCart.routes";
import banner from "./routes/banner.routes";
import inventory from "./routes/inventory.routes";
import productLog from "./routes/productLogs.routes";
import wishlist from "./routes/wishlist.routes";
import userAddress from "./routes/userAddress.routes";

import cors from "cors";

const app = express();
app.use(cors());
console.log(CONFIG.MONGOURI)
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
app.use("/category", category);
app.use("/product", product);
app.use("/brand", brand);
app.use("/attribute", attribute);
app.use("/attributeValue", attributeValue);
app.use("/tag", tag);
app.use("/userCart", userCart);
app.use("/banner", banner);
app.use("/logs", productLog);
app.use("/inventory", inventory);
app.use("/wishlist", wishlist);
app.use("/userAddress", userAddress);

app.use(errorHandler);

export default app;