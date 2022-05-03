import express from "express";
import { newFabricOrder, getAllFabricsOrders, dispatchFabricOrder, deliverFabricOrder } from "../controllers/fabricorder.controller";
let router = express.Router();

router.post("/newFabricOrder", newFabricOrder);

router.get("/getAllFabricsOrders", getAllFabricsOrders);

router.patch("/dispatchOrderById/:id", dispatchFabricOrder);
router.patch("/deliverOrderById/:id", deliverFabricOrder);

export default router;
