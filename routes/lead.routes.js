import express from "express";
import { AddLead, getLead, updateLead } from "../controllers/lead.controller";

let router = express.Router();
router.post("/", AddLead);
router.get("/", getLead);
router.patch("/updateById/:id", updateLead);

export default router;