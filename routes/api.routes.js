import express from 'express'

const router = express.Router()

router.use("/users", usersRouter);
router.use("/campaign", campaignRouter);
router.use("/lead", leadRouter);
router.use("/leadStatus", leadStatusRouter);
router.use("/linkedInAccount", linkedInAccountRouter);
router.use("/proxies", proxiesRouter);
router.use("/leadlogs", leadlogsRouter);
router.use("/leadComments", leadCommentRouter);
router.use("/emailSettings", emailSettingsRouter);
router.use("/customemail", customemailRouter);

export default router