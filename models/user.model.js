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


        searchCompleted: { type: Boolean, default: false },
        /////user fields
        email: { type: String },
        phone: { type: Number },
        employeeId: String,
        password: String,

        ////////client fields
        link: String,
        educationArr: Array,
        experienceArr: Array,
        contactInfoArr: Array,
        location: String,
        currentPosition: String,

    },
    { timestamps: true }
);

export default mongoose.model("User", User);
