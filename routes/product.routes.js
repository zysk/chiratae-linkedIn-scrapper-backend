import express from "express";
import {
    addProduct,
    deleteProductById,
    getAllProducts,
    updateProductById,
    getActiveProducts,
    getProductsPub,
    getProductsCategoryWise
} from "../controllers/product.controller";

let router = express.Router();

router.post("/addProduct", addProduct);
router.get("/getProducts", getAllProducts);
router.patch("/updateById/:id", updateProductById);

router.delete("/deleteById/:id", deleteProductById);
router.get("/getActiveProducts", getActiveProducts);


router.get("/getA", getProductsPub);
router.get("/get", getProductsCategoryWise);
export default router;