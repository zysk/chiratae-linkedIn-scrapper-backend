import express from "express";
import { addScheduledCampaign, checkLinkedInLogin, continueScheduled, getPastCampaign, getPastCampaignById, handleLogoutAndLoginAnotherAccount, linkedInLogin, linkedInProfileScrappingReq, linkedInSearch, searchLinkedin, sendLinkedInCaptchaInput, sendCampaignToSevanta, addCampaignToQueue } from "../controllers/Campaign.controller";
let router = express.Router();

router.post("/campaignLinkedin", searchLinkedin);
router.post("/linkedInProfileScrapping", linkedInProfileScrappingReq);
router.post("/campaignScheduleLinkedin", addScheduledCampaign);
router.get("/getcampaigns", getPastCampaign);
router.get("/getPastcampaignById/:id", getPastCampaignById);

router.post("/continueSchedule", continueScheduled);
router.post("/addCampaignToQueue", addCampaignToQueue);

router.post("/linkchecklogin", checkLinkedInLogin);
router.post("/linklogin", linkedInLogin);
router.post("/logoutAndLogoutAnotherAccount", handleLogoutAndLoginAnotherAccount);
router.post("/linkCaptcha", sendLinkedInCaptchaInput);
router.post("/linkSearch", linkedInSearch);
router.post("/addDealToSavanta/:id", sendCampaignToSevanta);
// router.get("/checkRatingForClient/:id", checkRatingForClient);

export default router;