import express from "express";
import { deleteTailor, getSpecificTailor, getTailors, registerTailor, updateTailor } from "../controllers/Tailor.controller";

let router = express.Router();

///register User
router.post("/createTailor", registerTailor);

router.get("/getTailors", getTailors);

router.patch("/updateById/:id", updateTailor);

// router.get("/getById/:id", getById);

router.delete("/deleteById/:id", deleteTailor);

router.get("/getSpecificTailor", getSpecificTailor);
export default router;
