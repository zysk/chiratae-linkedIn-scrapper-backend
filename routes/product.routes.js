import express from "express";
import { addProduct, deleteProduct, getAllProducts, updateProduct } from "../controllers/product.controller";
const router = express.Router();

router.post("/", addProduct);

router.get("/getAll", getAllProducts);

router.patch("/updateById/:id", updateProduct);

router.delete("/deleteById/:id", deleteProduct);

export default router;
