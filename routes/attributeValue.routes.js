import express from "express";
import { registerAttributeValue, updateById, deleteById,  getAttributeValue } from "../controllers/attributeValue.controller";

let router = express.Router();

///register User
router.post("/registerAttributeValue", registerAttributeValue);

router.get("/getAttributeValue", getAttributeValue);

router.patch("/updateById/:id", updateById);

router.delete("/deleteById/:id", deleteById);


export default router;
