import express from "express";
import { addScheduledCampaign, getPastCampaign, getPastCampaignById, linkedInLogin, linkedInSearch, searchLinkedin, sendLinkedInCaptchaInput } from "../controllers/Campaign.controller";
let router = express.Router();

router.post("/campaignLinkedin", searchLinkedin);
router.post("/campaignScheduleLinkedin", addScheduledCampaign);
router.get("/getcampaigns", getPastCampaign);
router.get("/getPastcampaignById/:id", getPastCampaignById);

router.post("/linklogin", linkedInLogin);
router.post("/linkCaptcha", sendLinkedInCaptchaInput);
router.post("/linkSearch", linkedInSearch);

export default router;