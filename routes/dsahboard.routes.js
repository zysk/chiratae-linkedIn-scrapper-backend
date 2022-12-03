import express from "express";
import { getDashBoard } from "../controllers/dashboard.controller";

let router = express.Router();
router.get("/getdashbord",getDashBoard);
export default router;