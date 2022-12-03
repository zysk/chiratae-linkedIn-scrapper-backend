import express from "express";
import { AddHeaderFooterConversion, getHeaderFooterConversion } from "../controllers/headerFooterConversion.controller";

let router = express.Router();

router.post("/AddHeaderFooterConversion", AddHeaderFooterConversion);
router.get("/getHeaderFooterConversion", getHeaderFooterConversion);

export default router;