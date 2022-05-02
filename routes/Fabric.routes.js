import express from "express";
import { addFabric, deleteFabric, getAllFabrics, updateFabric } from "../controllers/fabric.controller";
let router = express.Router();

router.post("/newFabric", addFabric);

router.get("/getAllFabric", getAllFabrics);

router.patch("/updateById/:id", updateFabric);

router.delete("/deleteById/:id", deleteFabric);

export default router;
