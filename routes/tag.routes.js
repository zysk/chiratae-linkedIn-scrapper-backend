import express from "express";
import { registerTag, updateById, deleteById, getTag } from "../controllers/tag.controller";
import { authorizeJwt } from "../middlewares/auth.middleware";
let router = express.Router();


router.post("/registerTag", registerTag);

router.get("/getTag", getTag);

router.patch("/updateById/:id", authorizeJwt, updateById);

router.delete("/deleteById/:id", authorizeJwt, deleteById);


export default router;