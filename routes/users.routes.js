import express from "express";
import { login, registerUser } from "../controllers/users.controller";

let router = express.Router();

///register User
router.post("/register", registerUser);

router.post("/login", login);

export default router;
