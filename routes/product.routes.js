import express from "express";
import {
    addProduct, getProductById, getProducts, updateProductById, getFilteredProducts, DeleteProductById
} from "../controllers/product.controller";

let router = express.Router();

router.post("/addProduct", addProduct);
router.get("/getProducts", getProducts);
router.get("/getFilteredProducts", getFilteredProducts);
router.get("/getProductById/:id", getProductById);
router.patch("/updateById/:id", updateProductById);
router.delete("/deleteById/:id", DeleteProductById);

export default router;