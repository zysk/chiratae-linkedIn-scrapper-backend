import usersRouter from "./users.routes";
import campaignRouter from "./Campaign.routes";
import leadRouter from "./Lead.routes";
import leadStatusRouter from "./LeadStatus.routes";
import linkedInAccountRouter from "./LinkedInAccounts.routes";
import proxiesRouter from "./Proxies.routes";
import leadlogsRouter from "./LeadLogs.routes";
import leadCommentRouter from "./LeadComment.routes";
import customEmailRouter from "./CustomEmail.router";
import path from "path";

export const setupRoutes = (app) => {
    // API Routes
    app.use("/users", usersRouter);
    app.use("/campaign", campaignRouter);
    app.use("/lead", leadRouter);
    app.use("/leadStatus", leadStatusRouter);
    app.use("/linkedInAccount", linkedInAccountRouter);
    app.use("/proxies", proxiesRouter);
    app.use("/leadlogs", leadlogsRouter);
    app.use("/leadComments", leadCommentRouter);
    app.use("/customemail", customEmailRouter);

    // SPA fallback
    app.get("*", (req, res) => {
        res.sendFile(path.join(__dirname, "../public", "index.html"));
    });
};