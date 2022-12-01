import express from "express";
import { Addpartner, getpartners } from "../controllers/partner.controller";

let router = express.Router();
router.post("/", Addpartner);
router.get("/", getpartners);
export default router;