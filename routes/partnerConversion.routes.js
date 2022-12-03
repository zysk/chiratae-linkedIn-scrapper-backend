import express from "express";
import { AddPartnerConversion, getPartnerPageConversions } from "../controllers/PartnerConversion.controller";

let router = express.Router();
router.post("/addpartnerpageConversion", AddPartnerConversion);
router.get("/getpartnerpageConversions", getPartnerPageConversions);
export default router;