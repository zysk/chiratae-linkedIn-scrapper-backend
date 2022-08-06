import express from "express";
import { addProduct, getAllProducts, updateProductById } from "../controllers/product.controller";

let router = express.Router();

router.post("/addProduct", addProduct);
router.get("/getProducts", getAllProducts);
router.patch("/updateById/:id", updateProductById);

export default router;
