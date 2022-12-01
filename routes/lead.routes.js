import express from "express";
import { AddLead, getLead } from "../controllers/lead.controller";

let router = express.Router();
router.post("/", AddLead);
router.get("/", getLead);
export default router;