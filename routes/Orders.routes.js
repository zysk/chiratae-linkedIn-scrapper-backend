import express from "express";
import {
    addOrder,
    getById,
    getAllOrders,
    updateOrderImages,
    updateOrderStatusToFabricCollector,
    allocateOrderToPatternCutter,
    allocateOrderToTailor,
    allocateOrderToQC,
    getTailorOrdersByOrderId,
    getQcOrders,
    TransferOrderInhouse,
    getInhouseOrders,
    getTailorsAvialabilityByDate,
    getCustomerOrderByDate,
} from "../controllers/Order.controller";
const router = express.Router();

router.post("/", addOrder);

router.get("/getAll", getAllOrders);
router.get("/getById/:id", getById);

router.patch("/updateOrderStatusToFabricCollector", updateOrderStatusToFabricCollector);

router.patch("/updateOrderImages", updateOrderImages);

router.patch("/allocatePatternCutter", allocateOrderToPatternCutter);
router.patch("/allocateOrderToTailor", allocateOrderToTailor);
router.patch("/allocateOrderToQC", allocateOrderToQC);
router.get("/getTailorsAvialabilityByDate", getTailorsAvialabilityByDate);
router.get("/getCustomerOrderByDate", getCustomerOrderByDate);

router.get("/getTailorOrdersByOrderId/:id", getTailorOrdersByOrderId);
router.get("/getQcOrders/:id", getQcOrders);
router.patch("/transferOrderInhouse", TransferOrderInhouse);
router.patch("/getInhouseOrders", getInhouseOrders);

export default router;
