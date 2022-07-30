import express from "express";
import { registerBanner, updateById, deleteById, getBanner, uploadFile } from "../controllers/banner.controller";
import { upload } from "../helpers/fileUpload";

let router = express.Router();

router.post("/register", upload.single('file'), registerBanner);
router.post("/addFile/:id", uploadFile);

router.get("/getBanner", getBanner);

router.patch("/updateById/:id", updateById);

router.delete("/deleteById/:id", deleteById);
s
export default router;