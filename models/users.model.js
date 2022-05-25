import mongoose from "mongoose";
import { rolesObj } from "../helpers/Constants";

let User = mongoose.Schema(
    {
        name: String,
        email: String,
        phone: Number,
        password: String,
        height: String,
        uid: String,
        age: String,
        customerId: String,
        profilePicture: String,
        frontPicture: String,
        backPicture: String,
        aadhaarNo: String,
        experience: String,
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
