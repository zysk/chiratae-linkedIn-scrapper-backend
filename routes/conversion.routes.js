import express from "express";
import {
    AddConversion, getConversions
} from "../controllers/conversion.controller";

let router = express.Router();
router.post("/AddConversion", AddConversion);
router.get("/getConversions", getConversions);
export default router;