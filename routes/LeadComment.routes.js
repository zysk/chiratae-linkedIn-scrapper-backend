import express from "express";
import { AddLeadComments, getLeadComments } from "../controllers/leadComment.controller";
import { authorizeJwt } from "../middlewares/auth.middleware";
let router = express.Router();
router.post("/", authorizeJwt, AddLeadComments);
router.get("/getByLeadId/:id", authorizeJwt, getLeadComments);
export default router;