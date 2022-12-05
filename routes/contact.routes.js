import express from "express";
import { AddContact, getContacts, updateContact } from "../controllers/contact.controller";

let router = express.Router();
router.post("/", AddContact);
router.get("/", getContacts);
router.patch("/updateById/:id", updateContact);

export default router;