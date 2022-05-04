import express from "express";
import { deleteUser, getUsers, login, registerOtherUsers, registerUser, updateUser } from "../controllers/users.controller";

let router = express.Router();

///register User
router.post("/register", registerUser);

router.post("/login", login);

router.post("/registerOtherUsers", registerOtherUsers);

router.get("/getUsers", getUsers);

router.patch("/updateById/:id", updateUser);

// router.get("/getById/:id", getById);

router.delete("/deleteById/:id", deleteUser);

export default router;
