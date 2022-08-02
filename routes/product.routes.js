import express from "express";
import { registerProduct, updateById, deleteById, getProduct } from "../controllers/product.controller";
import { authorizeJwt } from "../middlewares/auth.middleware";

let router = express.Router();


router.post("/registerProduct", registerProduct);

router.get("/getProduct", getProduct);

router.patch("/updateById/:id", authorizeJwt, updateById);

router.delete("/deleteById/:id", authorizeJwt, deleteById);


export default router;