import express from "express";
import { Addpartner, getpartners, updatePartner } from "../controllers/partner.controller";

let router = express.Router();
router.post("/", Addpartner);
router.get("/", getpartners);
router.patch("/updateById/:id", updatePartner);

export default router;