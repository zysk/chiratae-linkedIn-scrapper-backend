import express from "express";
import { addProduct, getAllProducts } from "../controllers/product.controller";

let router = express.Router();

router.post("/addProduct", addProduct);
router.get("/getProducts", getAllProducts);
export default router;
