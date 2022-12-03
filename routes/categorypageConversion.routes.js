import express from "express";
import { AddCategorypageConversion, getCategoryPageConversions } from "../controllers/categorypageConversion.controller";

let router = express.Router();

router.post("/AddCategorypageConversion", AddCategorypageConversion);
router.get("/getCategoryPageConversions", getCategoryPageConversions);

export default router;