import express from "express";
import { addOrder, getById, getAllOrders, updateOrderImages, updateOrderStatusToFabricCollector, allocateOrderToPatternCutter, allocateOrderToTailor, allocateOrderToQC } from "../controllers/Order.controller";
const router = express.Router();

router.post("/", addOrder);

router.get("/getAll", getAllOrders);
router.get("/getById/:id", getById);

router.patch("/updateOrderStatusToFabricCollector", updateOrderStatusToFabricCollector);

router.patch("/updateOrderImages", updateOrderImages);

router.patch("/allocatePatternCutter", allocateOrderToPatternCutter);
router.patch("/allocateOrderToTailor", allocateOrderToTailor);
router.patch("/allocateOrderToQC", allocateOrderToQC);

export default router;
