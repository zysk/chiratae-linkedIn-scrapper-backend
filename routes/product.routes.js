import express from "express";
import {
    addProduct, getProductById, getProducts, updateProductById, getFilteredProducts, DeleteProductById, getProductByProductId, getComparisionProductsProducts
} from "../controllers/product.controller";

let router = express.Router();

router.post("/addProduct", addProduct);
router.get("/getProducts", getProducts);
router.get("/getFilteredProducts", getFilteredProducts);
router.get("/getComparisionProductsProducts", getComparisionProductsProducts);
router.get("/getProductById/:id", getProductById);
router.get("/getProductByProductId/:id", getProductByProductId);
router.patch("/updateById/:id", updateProductById);
router.delete("/deleteById/:id", DeleteProductById);

export default router;