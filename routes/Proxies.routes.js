import express from "express";
import { createNewProxy, deleteProxy, getProxies } from "../controllers/proxy.controller";
let router = express.Router();
router.post("/", createNewProxy);
router.get("/", getProxies);
router.delete("/deleteById/:id", deleteProxy);
export default router;