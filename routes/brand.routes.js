import express from "express";
import { registerBrand, updateById, deleteById, getBrand } from "../controllers/brand.controller";
import { authorizeJwt } from "../middlewares/auth.middleware";

let router = express.Router();


router.post("/registerBrand", registerBrand);

router.get("/getBrand", getBrand);

router.patch("/updateById/:id", authorizeJwt, updateById);

router.delete("/deleteById/:id", authorizeJwt, deleteById);


export default router;