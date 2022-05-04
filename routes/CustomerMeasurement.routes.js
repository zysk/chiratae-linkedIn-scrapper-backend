import express from "express";
import { addCustomerMeasurement, deleteCustomerMeasurement, getAllCustomerMeasurements, updateCustomerMeasurement } from "../controllers/CustomerMeasurement";
const router = express.Router();

router.post("/", addCustomerMeasurement);

router.get("/getAll", getAllCustomerMeasurements);

router.patch("/updateById/:id", updateCustomerMeasurement);

router.delete("/deleteById/:id", deleteCustomerMeasurement);

export default router;
