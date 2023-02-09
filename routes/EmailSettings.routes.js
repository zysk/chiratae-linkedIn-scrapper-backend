import express from "express";
import { createNewEmailSettings, getEmailSettings } from "../controllers/EmailSettings.controller";
let router = express.Router();

router.post("/", createNewEmailSettings);
router.get("/", getEmailSettings);

export default router;