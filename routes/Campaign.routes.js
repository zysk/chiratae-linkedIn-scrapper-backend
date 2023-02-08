import express from "express";
import { addScheduledCampaign, checkLinkedInLogin, checkRatingForClient, getPastCampaign, getPastCampaignById, handleLogoutAndLoginAnotherAccount, linkedInLogin, linkedInSearch, searchLinkedin, sendLinkedInCaptchaInput } from "../controllers/Campaign.controller";
let router = express.Router();

router.post("/campaignLinkedin", searchLinkedin);
router.post("/campaignScheduleLinkedin", addScheduledCampaign);
router.get("/getcampaigns", getPastCampaign);
router.get("/getPastcampaignById/:id", getPastCampaignById);

router.post("/linkchecklogin", checkLinkedInLogin);
router.post("/linklogin", linkedInLogin);
router.post("/logoutAndLogoutAnotherAccount", handleLogoutAndLoginAnotherAccount);
router.post("/linkCaptcha", sendLinkedInCaptchaInput);
router.post("/linkSearch", linkedInSearch);
// router.get("/checkRatingForClient/:id", checkRatingForClient);

export default router;