import express from "express";
import { registerAttribute, updateById, deleteById, getAttribute } from "../controllers/attribute.controller";
import { authorizeJwt } from "../middlewares/auth.middleware";
let router = express.Router();

router.post("/registerAttribute", registerAttribute);

router.get("/getAttribute", getAttribute);

router.patch("/updateById/:id", authorizeJwt, updateById);

router.delete("/deleteById/:id", authorizeJwt, deleteById);

export default router;