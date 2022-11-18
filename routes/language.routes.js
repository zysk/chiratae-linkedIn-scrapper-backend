import express from "express";
import {
    AddLanguage, deleteLanguage, getLanguages, updateLanguage,
} from "../controllers/language.controller";

let router = express.Router();
router.post("/addLanguage", AddLanguage);
router.get("/getLanguages", getLanguages);
router.patch("/updateById/:id", updateLanguage);
router.delete("/deleteById/:id", deleteLanguage);
export default router;