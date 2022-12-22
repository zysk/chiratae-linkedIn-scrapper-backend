import mongoose from "mongoose";
import { rolesObj } from "../helpers/Constants";

let LinkedInAccounts = mongoose.Schema(
    {
        name: String,
        password: String,
    },
    { timestamps: true }
);

export default mongoose.model("LinkedInAccounts", LinkedInAccounts);
