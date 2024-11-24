import express from "express";
import { createCustomEmail, getCustomEmail } from "../controllers/CustomEmail.controller";
let router = express.Router();

router.post("/", createCustomEmail);
router.get("/", getCustomEmail);

export default router;
