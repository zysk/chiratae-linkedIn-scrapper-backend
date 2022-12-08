import express from "express";
import {
    addProduct, getProductById, getProducts, updateProductById, getFilteredProducts, DeleteProductById, getProductByProductId, getComparisionProductsProducts, searchProductByName, updateProductsById, getProductGroupById
} from "../controllers/product.controller";

let router = express.Router();

router.post("/addProduct", addProduct);
router.get("/getProducts", getProducts);
router.get("/getFilteredProducts", getFilteredProducts);
router.get("/getComparisionProductsProducts", getComparisionProductsProducts);
router.get("/getProductById/", getProductById);
router.get("/getProductGroupById/", getProductGroupById);
router.get("/searchProductByName", searchProductByName);
router.get("/getProductByProductId/:id/:languageId", getProductByProductId);
router.patch("/updateById/:id", updateProductsById);
router.delete("/deleteById/:id", DeleteProductById);

export default router;