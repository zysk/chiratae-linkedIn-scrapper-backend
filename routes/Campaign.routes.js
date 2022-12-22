import express from "express";
import { addScheduledCampaign, getPastCampaign, getPastCampaignById, searchLinkedin } from "../controllers/Campaign.controller";
let router = express.Router();

router.post("/campaignLinkedin", searchLinkedin);
router.post("/campaignScheduleLinkedin", addScheduledCampaign);
router.get("/getcampaigns", getPastCampaign);
router.get("/getPastcampaignById/:id", getPastCampaignById);
export default router;