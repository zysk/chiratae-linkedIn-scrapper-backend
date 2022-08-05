import express from "express";
import { getCategory, updateById, deleteById, addCategory, getNestedCategory } from "../controllers/category.controller";
import { authorizeJwt } from "../middlewares/auth.middleware";
let router = express.Router();

router.post("/addCategory", addCategory);

router.get("/getCategory", getCategory);

router.patch("/updateById/:id", authorizeJwt, updateById);

router.delete("/deleteById/:id", authorizeJwt, deleteById);

router.get("/getNestedCategories", getNestedCategory);

export default router;
