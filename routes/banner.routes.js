import express from "express";
import { registerBanner, updateById, deleteById, getBanner } from "../controllers/banner.controller";
import { authorizeJwt } from "../middlewares/auth.middleware";
let router = express.Router();

router.post("/register", registerBanner);

router.get("/getBanner", getBanner);

router.patch("/updateById/:id", authorizeJwt, updateById);

router.delete("/deleteById/:id", authorizeJwt, deleteById);

export default router;