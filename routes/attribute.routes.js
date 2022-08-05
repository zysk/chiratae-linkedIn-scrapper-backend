import express from "express";
import { updateById, deleteById, getAttribute, addAttributValue, getAttributeValue, updateAttributeValueById, deleteAttributeValueById, addAttribute } from "../controllers/attribute.controller";
import { authorizeJwt } from "../middlewares/auth.middleware";
let router = express.Router();

router.post("/addAttribute", addAttribute);

router.get("/getAttribute", getAttribute);

router.patch("/updateById/:id", authorizeJwt, updateById);

router.delete("/deleteById/:id", authorizeJwt, deleteById);
router.post("/addAttributValue", addAttributValue);
router.get("/getAttributeValue", getAttributeValue);

router.patch("/updateAttributeValueById/:id", updateAttributeValueById);

router.delete("/deleteAttributeValueById/:id", deleteAttributeValueById);
export default router;
