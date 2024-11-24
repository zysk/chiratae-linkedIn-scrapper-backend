import express from "express";
import usersRouter from "./users.routes";
import campaignRouter from "./Campaign.routes";
import leadRouter from "./Lead.routes";
import leadStatusRouter from "./LeadStatus.routes";
import linkedInAccountRouter from "./LinkedInAccounts.routes";
import proxiesRouter from "./Proxies.routes";
import leadlogsRouter from "./LeadLogs.routes";
import leadCommentRouter from "./LeadComment.routes";
import customEmailRouter from "./CustomEmail.router";

const router = express.Router();

router.use("/users", usersRouter);
router.use("/campaign", campaignRouter);
router.use("/lead", leadRouter);
router.use("/leadStatus", leadStatusRouter);
router.use("/linkedInAccount", linkedInAccountRouter);
router.use("/proxies", proxiesRouter);
router.use("/leadlogs", leadlogsRouter);
router.use("/leadComments", leadCommentRouter);
router.use("/customemail", customEmailRouter);

export default router;
