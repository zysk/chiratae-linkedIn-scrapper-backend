import express from "express";
import { AddHomePageConversion, getHomepagePageConversions } from "../controllers/homepageConversion.controller";

let router = express.Router();

router.post("/AddHomepageConversion", AddHomePageConversion);
router.get("/getHomepageConversions", getHomepagePageConversions);

export default router;