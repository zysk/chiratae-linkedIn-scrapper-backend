import express from "express";
import { addOrder, getAllOrders, updateOrderImages, updateOrderStatusToFabricCollector, allocateOrderToPatternCutter } from "../controllers/Order.controller";
const router = express.Router();

router.post("/", addOrder);

router.get("/getAll", getAllOrders);

router.patch("/updateOrderStatusToFabricCollector", updateOrderStatusToFabricCollector);

router.patch("/updateOrderImages", updateOrderImages);

router.patch("/allocatePatternCutter", allocateOrderToPatternCutter);

export default router;
