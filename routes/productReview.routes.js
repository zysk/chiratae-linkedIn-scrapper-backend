import express from "express";
import { addReview, updateById, deleteById, getReview } from "../controllers/productReview.controller";
import { authorizeJwt } from "../middlewares/auth.middleware";
let router = express.Router();

router.post("/registerReview", addReview);

router.get("/getReview", getReview);

router.patch("/updateById/:id", updateById);

router.delete("/deleteById/:id", deleteById);


export default router;