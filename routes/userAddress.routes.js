import express from "express";
import { registerUserAddress, getUserAddress, updateUserAddress, deleteAddress } from "../controllers/userAddress.controller";
import { authorizeJwt } from "../middlewares/auth.middleware";
let router = express.Router();


router.post("/registerUserAddress", authorizeJwt, registerUserAddress);


router.get("/getUserAddress", getUserAddress);


router.patch("/updateById/:id", authorizeJwt, updateUserAddress);


router.delete("/deleteById/:id", authorizeJwt, deleteAddress);

export default router;