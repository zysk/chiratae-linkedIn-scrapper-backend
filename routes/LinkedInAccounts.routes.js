import express from "express";
import { createNewLinkedInAccount, deleteLinkedInAccount, getLinkedInAccounts } from "../controllers/linkedInAccount.controller";
let router = express.Router();
router.post("/", createNewLinkedInAccount);
router.get("/", getLinkedInAccounts);
router.delete("/deleteById/:id", deleteLinkedInAccount);
export default router;
