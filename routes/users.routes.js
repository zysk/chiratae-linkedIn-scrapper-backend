import express from "express";
import { deleteUser, getTotalUser, getUserById, getUserDetailsWithCampaignsData, getUsers, login, loginAdmin, registerAdmin, registerUser, setUserRating, updateUser } from "../controllers/users.controller";
let router = express.Router();

router.post("/register", registerUser);
router.post("/login", login);
router.get("/getUsers", getUsers);
router.get("/getUserDetailsWithCampaignsData/:id", getUserDetailsWithCampaignsData);
router.patch("/updateById/:id", updateUser);
router.get("/getById/:id", getUserById);
router.get("/setUserRating", setUserRating);


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
