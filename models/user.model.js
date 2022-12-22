import mongoose from "mongoose";
import { rolesObj } from "../helpers/Constants";

let User = mongoose.Schema(
    {
        /////common fields
        name: String,
        isActive: { type: Boolean, default: false },
        role: {
            type: String,
            default: rolesObj.USER,
        },



        /////user fields
        email: { type: String },
        phone: { type: Number },
        employeeId: String,
        password: String,

        ////////client fields
        link: String,
        educationArr: Array,
        location: String,
        currentPosition: String,

    },
    { timestamps: true }
);

export default mongoose.model("User", User);
