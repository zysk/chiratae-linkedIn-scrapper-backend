import express from "express";
import {
    addScheduledCampaign,
    checkLinkedInLogin,
    continueScheduled,
    getPastCampaign,
    getPastCampaignById,
    handleLogoutAndLoginAnotherAccount,
    linkedInLogin,
    linkedInProfileScrappingReq,
    linkedInSearch,
    searchLinkedin,
    sendLinkedInCaptchaInput,
    sendCampaignToSevanta,
    addCampaignToQueue,
    cron,
    verifyOtp,
    resendPhoneCheck,
} from "../controllers/Campaign.controller";
import { authorizeJwt } from "../middlewares/auth.middleware";
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
router.post("/verifyOtp", verifyOtp);
router.post("/resendPhoneCheck", resendPhoneCheck)
router.post("/addDealToSavanta/:id", authorizeJwt, sendCampaignToSevanta);
router.get("/cron", cron);
// router.get("/checkRatingForClient/:id", checkRatingForClient);

export default router;
