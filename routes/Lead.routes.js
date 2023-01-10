import express from "express";
import { assignLeadToUser, createNewLead, deleteLead, getLeads } from "../controllers/lead.controller";
let router = express.Router();
router.post("/", createNewLead);
router.get("/", getLeads);
router.patch("/assignLeadToUser/:id", assignLeadToUser);
router.delete("/deleteById/:id", deleteLead);
export default router;