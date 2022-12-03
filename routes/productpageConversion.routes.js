import express from "express";
import { AddProductpageConversion, getProductPageConversions } from "../controllers/productpageConversion.controller";

let router = express.Router();

router.post("/AddProductpageConversion", AddProductpageConversion);
router.get("/getProductPageConversions", getProductPageConversions);

export default router;