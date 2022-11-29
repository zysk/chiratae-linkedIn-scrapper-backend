import express from "express";
import {
    AddConversion, getConversions, updateConversation
} from "../controllers/conversion.controller";

let router = express.Router();
router.post("/AddConversion", AddConversion);
router.get("/getConversions", getConversions);
router.post("/updateConversation/:id", updateConversation);
export default router;