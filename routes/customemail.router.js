import express from "express";
import { createcustomemail, getcustomemail } from "../controllers/customemail.controller";
let router = express.Router();

router.post("/", createcustomemail);
router.get("/", getcustomemail);

export default router;