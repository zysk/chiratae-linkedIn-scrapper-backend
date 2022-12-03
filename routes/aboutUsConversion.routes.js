import express from "express";
import { AddAboutConversion, getAboutPageConversions } from "../controllers/aboutUsConversion.controller";

let router = express.Router();
router.post("/AddAboutpageConversion", AddAboutConversion);
router.get("/getAboutpageConversions", getAboutPageConversions);
// router.post("/updateConversation/:id", updateConversation);
export default router;