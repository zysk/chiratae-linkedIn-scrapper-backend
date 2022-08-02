import express from "express";
import { getCategory, updateById, deleteById, registerCategory } from "../controllers/category.controller";
import { authorizeJwt } from "../middlewares/auth.middleware";
let router = express.Router();

router.post("/registerCategory", registerCategory)

router.get("/getCategory", getCategory);

router.patch("/updateById/:id", authorizeJwt, updateById);

router.delete("/deleteById/:id", authorizeJwt, deleteById);


export default router;