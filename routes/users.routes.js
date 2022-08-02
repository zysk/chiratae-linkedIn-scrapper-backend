import express from "express";
import { deleteUser, getUsers, registerUser, updateUser, userKyc, getUserData, changeUserKyc, login, loginAdmin, registerAdmin } from "../controllers/users.controller";

let router = express.Router();


router.post("/register", registerUser);
router.post("/login", login);
router.post("/userKyc/:id", userKyc);

router.get("/getUserData", getUserData);
router.get("/getUsers", getUsers);

router.patch("/updateById/:id", updateUser);
router.patch("/changeUserKyc", changeUserKyc);

router.delete("/deleteById/:id", deleteUser);

//admin =
router.post("/registerAdmin", registerAdmin);
router.post("/loginAdmin", loginAdmin);
export default router;