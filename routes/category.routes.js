import express from "express";
import { getCategory, updateById, deleteById,  registerCategory } from "../controllers/category.controller";

let router = express.Router();

router.post("/registerCategory", registerCategory)

router.get("/getCategory", getCategory);

router.patch("/updateById/:id", updateById);

router.delete("/deleteById/:id", deleteById);


export default router;
