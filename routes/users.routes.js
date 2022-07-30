import express from "express";
import { deleteUser, getUsers, registerUser, updateUser, kycUpload } from "../controllers/users.controller";

let router = express.Router();


router.post("/register", registerUser);
router.post("/kycFiles/:id", kycUpload);

router.get("/getUsers", getUsers);

// router.patch("/updateById/:id", updateUser);

// router.delete("/deleteById/:id", deleteUser);


export default router;