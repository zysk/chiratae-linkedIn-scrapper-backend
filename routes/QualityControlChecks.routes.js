import express from "express";
import { addQualityControlChecks, deleteById, getAllQualityControlChecks, getById, updateById } from "../controllers/QualityControlChecks.controller";

let router = express.Router();

///register User
router.post("/create", addQualityControlChecks);

router.get("/getAll", getAllQualityControlChecks);

router.patch("/updateById/:id", updateById);

router.get("/getById/:id", getById);

router.delete("/deleteById/:id", deleteById);

export default router;
