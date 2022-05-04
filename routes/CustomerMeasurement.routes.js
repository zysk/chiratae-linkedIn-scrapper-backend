import express from "express";
import { addCustomerMeasurement, deleteCustomerMeasurement, getAllCustomerMeasurements, getById, updateCustomerMeasurement } from "../controllers/CustomerMeasurement.controller";
const router = express.Router();

router.post("/", addCustomerMeasurement);

router.get("/getAll/:id", getAllCustomerMeasurements);

router.patch("/updateById/:id", updateCustomerMeasurement);

router.get("/getById/:id", getById);

router.delete("/deleteById/:id", deleteCustomerMeasurement);

export default router;
