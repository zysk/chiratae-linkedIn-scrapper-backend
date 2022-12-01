import express from "express";
import { AddHomePageBanner, deleteHomePageBanner, getHomePageBanner, updateHomePageBanner } from "../controllers/homepageBanner.controller";

let router = express.Router();
router.post("/", AddHomePageBanner);
router.get("/", getHomePageBanner);
router.delete("/deleteById/:id", deleteHomePageBanner);
router.patch("/updateById/:id", updateHomePageBanner);
export default router;