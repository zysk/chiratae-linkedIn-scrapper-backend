import mongoose from "mongoose";
import { rolesObj } from "../helpers/Constants";

let User = mongoose.Schema(
    {
        name: String,
        email: String,
        phone: Number,
        password: String,
        age: String,
        profilePicture: String,
        city: String,
        address: String,
        role: {
            type: String,
            default: rolesObj.CUSTOMER,
        },
    },
    { timestamps: true }
);

export default mongoose.model("User", User);
