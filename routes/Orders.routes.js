import express from "express";
import { addOrder, getAllOrders, updateOrderStatusToFabricCollector } from "../controllers/Order.controller";
const router = express.Router();

router.post("/", addOrder);

router.get("/getAll", getAllOrders);

router.patch("/updateOrderStatusToFabricCollector", updateOrderStatusToFabricCollector);

export default router;
