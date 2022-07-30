import express from "express";
import { removeProduct, getCart, updateCart } from "../controllers/userCart.controller";

let router = express.Router();


router.get("/getCart/:id", getCart);

router.patch("/updateCart/:id", updateCart);
// router.patch("/addProductTocart", addProductTocart);
router.patch("/removeProduct/:id", removeProduct);


export default router;
