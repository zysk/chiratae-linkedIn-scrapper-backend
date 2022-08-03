import express from "express";
import { changeUserKyc, deleteUser, getUserData, getUsers, login, loginAdmin, registerAdmin, registerUser, userKyc } from "../controllers/users.controller";
let router = express.Router();

router.post("/register", registerUser);
router.post("/login", login);
router.post("/userKyc/:id", userKyc);

router.get("/getUserData", getUserData);
router.get("/getUsers", getUsers);

router.patch("/changeUserKyc", changeUserKyc);

router.delete("/deleteById/:id", deleteUser);

//admin =
router.post("/registerAdmin", registerAdmin);
router.post("/loginAdmin", loginAdmin);
export default router;
