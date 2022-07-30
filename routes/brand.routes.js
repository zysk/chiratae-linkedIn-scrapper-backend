import express from "express";
import { registerBrand, updateById, deleteById,  getBrand } from "../controllers/brand.controller";

let router = express.Router();


router.post("/registerBrand", registerBrand);

router.get("/getBrand", getBrand);

router.patch("/updateById/:id", updateById);

router.delete("/deleteById/:id", deleteById);


export default router;
