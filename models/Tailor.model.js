import mongoose from "mongoose";
import { rolesObj } from "../helpers/Constants";

let Tailor = mongoose.Schema(
    {
        name: String,
        email: String,
        phone: Number,
        uid: String,
        profilePicture: String,
        aadhaarNo: String,
        experience: String,
        city: String,
        address: String,
        perDayCapacity: Number,
        perHrCost: Number,
        productArr: [{ productId: String }],
    },
    { timestamps: true }
);

export default mongoose.model("Tailor", Tailor);
