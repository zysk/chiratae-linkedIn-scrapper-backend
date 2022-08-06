import express from "express";
import { addMail, updateById, deleteById, getMail } from "../controllers/contactMail.controller";
import { authorizeJwt } from "../middlewares/auth.middleware";
let router = express.Router();

router.post("/", addMail);

router.get("/get", getMail);

router.delete("/deleteById/:id", authorizeJwt, deleteById); //only for ADMIN

export default router;