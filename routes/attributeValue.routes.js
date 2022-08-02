import express from "express";
import { registerAttributeValue, updateById, deleteById, getAttributeValue } from "../controllers/attributeValue.controller";
import { authorizeJwt } from "../middlewares/auth.middleware";
let router = express.Router();

router.post("/registerAttributeValue", registerAttributeValue);

router.get("/getAttributeValue", getAttributeValue);

router.patch("/updateById/:id", authorizeJwt, updateById);

router.delete("/deleteById/:id", authorizeJwt, deleteById);


export default router;