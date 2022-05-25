import express from "express";
import { addProduct, deleteProduct, getAllProducts, getAllProductsWithMeasurement, updateProduct } from "../controllers/product.controller";
const router = express.Router();

router.post("/", addProduct);

router.get("/getAll", getAllProducts);

router.patch("/updateById/:id", updateProduct);

router.delete("/deleteById/:id", deleteProduct);

router.get("/getAllProductsWithMeasurement", getAllProductsWithMeasurement);
export default router;
