import mongoose from "mongoose";
import { rolesObj } from "../helpers/Constants";

let banner = mongoose.Schema({
    image: { type: String },
    url: { type: String, required: true, unique: true },
    categoryId: { type: mongoose.Types.ObjectId, ref: "category" },
    slide: { type: String }

}, { timestamps: true });

export default mongoose.model("banner", banner)