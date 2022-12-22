import mongoose from "mongoose";
import { rolesObj } from "../helpers/Constants";

let Proxies = mongoose.Schema(
    {
        value: String,
    },
    { timestamps: true }
);

export default mongoose.model("Proxies", Proxies);
