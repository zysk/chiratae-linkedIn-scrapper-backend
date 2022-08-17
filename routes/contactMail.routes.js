import express from "express";
import { addMail, downloadQrCode, deleteById, getMail } from "../controllers/contactMail.controller";
import { authorizeJwt } from "../middlewares/auth.middleware";

let router = express.Router();

router.post("/", addMail);

router.get("/get", getMail);

router.delete("/deleteById/:id", authorizeJwt, deleteById);

router.get("/qrCode/:text", downloadQrCode);
export default router;
