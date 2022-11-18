import express from "express";
import {
    addProduct, getProductById, getProducts, updateProductById
} from "../controllers/product.controller";

let router = express.Router();

router.post("/addProduct", addProduct);
router.get("/getProducts", getProducts);
router.get("/getProductById/:id", getProductById);
router.get("/updateById/:id", updateProductById);

export default router;