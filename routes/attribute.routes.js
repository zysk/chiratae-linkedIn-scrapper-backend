import express from "express";
import { registerAttribute, updateById, deleteById,  getAttribute } from "../controllers/attribute.controller";

let router = express.Router();


router.post("/registerAttribute", registerAttribute);

router.get("/getAttribute", getAttribute);

router.patch("/updateById/:id", updateById);

router.delete("/deleteById/:id", deleteById);

export default router;
