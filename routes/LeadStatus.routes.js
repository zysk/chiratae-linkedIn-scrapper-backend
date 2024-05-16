import express from "express";
import { createNewLeadStatus, deleteLeadStatus, getLeadStatus } from "../controllers/leadStatus.controller";
let router = express.Router();
router.post("/", createNewLeadStatus);
router.get("/", getLeadStatus);
router.delete("/deleteById/:id", deleteLeadStatus);
export default router;
