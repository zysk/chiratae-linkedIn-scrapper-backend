import express from "express";
import { getUsers, login, registerOtherUsers, registerUser } from "../controllers/users.controller";

let router = express.Router();

///register User
router.post("/register", registerUser);

router.post("/login", login);

router.post("/registerOtherUsers", registerOtherUsers);

router.get("/getUsers", getUsers);

export default router;
