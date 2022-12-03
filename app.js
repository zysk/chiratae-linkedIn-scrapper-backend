import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import logger from "morgan";
import path from "path";
import { CONFIG } from "./helpers/Config";
import { errorHandler } from "./helpers/ErrorHandler";
import languageRouter from "./routes/language.routes";
import product from "./routes/product.routes";

//routes
import usersRouter from "./routes/users.routes";
import conversionRouter from "./routes/conversion.routes";
import aboutPageconversionRouter from "./routes/aboutUsConversion.routes";
import contactRouter from "./routes/contact.routes";
import partnerRouter from "./routes/partner.routes";
import leadRouter from "./routes/lead.routes";
import homepageBannerRouter from "./routes/homepageBanner.routes";
import partnerPageconversionRouter from "./routes/partnerConversion.routes";
import homepageConversionRouter from "./routes/homepageConversion.routes";
import categoryPageConversionRouter from "./routes/categorypageConversion.routes";
import productpageConversionRouter from "./routes/productpageConversion.routes";
import headerFooterConversionRouter from "./routes/HeaderFooterConversion.routes";

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

app.use("/users", usersRouter);
app.use("/product", product);
app.use("/language", languageRouter);
app.use("/conversion", conversionRouter);
app.use("/aboutPageConversion", aboutPageconversionRouter);
app.use("/partnerPageConversion", partnerPageconversionRouter);
app.use("/contact", contactRouter);
app.use("/partner", partnerRouter);
app.use("/lead", leadRouter);
app.use("/homepageBanner", homepageBannerRouter);
app.use("/homepageConversion", homepageConversionRouter);
app.use("/categoryPageConversion", categoryPageConversionRouter);
app.use("/productPageConversion", productpageConversionRouter);
app.use("/headerFooterConversion", headerFooterConversionRouter);

app.use(errorHandler);

export default app;