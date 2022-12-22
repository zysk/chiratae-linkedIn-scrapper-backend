import express from "express";
import { deleteUser, getUsers, login, loginAdmin, registerAdmin, registerUser, updateUser } from "../controllers/users.controller";
let router = express.Router();

router.post("/register", registerUser);
router.post("/login", login);
router.get("/getUsers", getUsers);
router.patch("/updateById/:id", updateUser);


router.delete("/deleteById/:id", deleteUser);

//admin =
router.post("/registerAdmin", registerAdmin);
router.post("/loginAdmin", loginAdmin);
// //
// //total--customer
// router.get("/totalCustomer", getTotalCustomer);
// //active customer
// router.get("/activeCustomer", getActiveCustomer);
export default router;
