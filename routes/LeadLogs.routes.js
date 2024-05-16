import express from "express";
import { getLeadLogs } from "../controllers/leadLogs.controller";
let router = express.Router();
router.get("/getByLeadId/:id", getLeadLogs);
export default router;
