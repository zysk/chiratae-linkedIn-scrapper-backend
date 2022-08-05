import express from "express";
import { addProduct, deleteProductById, getAllProducts, updateProductById } from "../controllers/product.controller";

let router = express.Router();

router.post("/addProduct", addProduct);
router.get("/getProducts", getAllProducts);
router.patch("/updateById/:id", updateProductById);

router.delete("/deleteById/:id", deleteProductById);

export default router;
