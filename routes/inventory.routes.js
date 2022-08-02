import express from "express";
import { createInventory, updateStocks, deleteInventory, getStocks } from "../controllers/inventory.controller";
import { authorizeJwt } from "../middlewares/auth.middleware";

let router = express.Router();


router.post("/createInventory", createInventory);

router.get("/getStocks", getStocks);

router.patch("/updateById/:id", authorizeJwt, updateStocks);

router.delete("/deleteById/:id", authorizeJwt, deleteInventory);


export default router;