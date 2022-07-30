import mongoose from "mongoose";
import { rolesObj } from "../helpers/Constants";

let banner = mongoose.Schema({
    image: { type: String, required: true },
    url: { type: String, required: true },
    categoryId: { type: mongoose.Types.ObjectId, ref: "category" },

}, { timestamps: true });

export default mongoose.model("banner", banner);