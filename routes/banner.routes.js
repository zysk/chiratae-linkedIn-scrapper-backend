import express from "express";
import { updateById, deleteById, getBanner, addBanner } from "../controllers/banner.controller";
import { authorizeJwt } from "../middlewares/auth.middleware";
let router = express.Router();

router.post("/addBanner", addBanner);

router.get("/getBanner", getBanner);

router.patch("/updateById/:id", updateById);

router.delete("/deleteById/:id", deleteById);

export default router;
