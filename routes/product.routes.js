import express from "express";
import { registerProduct, updateById, deleteById,  getProduct } from "../controllers/product.controller";

let router = express.Router();


router.post("/registerProduct", registerProduct);

router.get("/getProduct", getProduct);

router.patch("/updateById/:id", updateById);

router.delete("/deleteById/:id", deleteById);


export default router;
