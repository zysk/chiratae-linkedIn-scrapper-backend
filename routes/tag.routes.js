import express from "express";
import { registerTag, updateById, deleteById,  getTag} from "../controllers/tag.controller";

let router = express.Router();


router.post("/registerTag", registerTag);

router.get("/getTag", getTag);

router.patch("/updateById/:id", updateById);

router.delete("/deleteById/:id", deleteById);


export default router;
