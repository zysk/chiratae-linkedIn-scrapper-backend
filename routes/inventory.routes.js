import express from "express";
import { createInventory, updateStocks, deleteInventory, getStocks } from "../controllers/inventory.controller";

let router = express.Router();


router.post("/createInventory", createInventory);

router.get("/getStocks", getStocks);

router.patch("/updateById/:id", updateStocks);

router.delete("/deleteById/:id", deleteInventory);


export default router;