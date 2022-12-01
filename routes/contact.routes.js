import express from "express";
import { AddContact, getContacts } from "../controllers/contact.controller";

let router = express.Router();
router.post("/", AddContact);
router.get("/", getContacts);
export default router;