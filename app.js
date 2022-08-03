import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import logger from "morgan";
import path from "path";
import { CONFIG } from "./helpers/Config";
import { errorHandler } from "./helpers/ErrorHandler";
import attribute from "./routes/attribute.routes";
import attributeValue from "./routes/attributeValue.routes";
import banner from "./routes/banner.routes";
import brand from "./routes/brand.routes";
import category from "./routes/category.routes";
import indexRouter from "./routes/index.routes";
import inventory from "./routes/inventory.routes";
import product from "./routes/product.routes";
import productLog from "./routes/productLogs.routes";
import tag from "./routes/tag.routes";
import userCart from "./routes/userCart.routes";

// //routes
import usersRouter from "./routes/users.routes";
import wishlist from "./routes/wishlist.routes";
import userAddress from "./routes/userAddress.routes";
import TaxRouter from "./routes/Tax.routes";

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
app.use("/tax", TaxRouter);

app.use(errorHandler);

export default app;
