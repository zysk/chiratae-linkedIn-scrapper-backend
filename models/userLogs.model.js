import mongoose from "mongoose";
import { rolesObj } from "../helpers/utils/Constants";

let userlogs = mongoose.Schema(
    {
        /////common fields
        name: String,
        role: {
            type: String,
            default: rolesObj.USER,
        },
        searchCompleted: { type: Boolean, default: false },
        /////user fields
        campaignId: { type: mongoose.Types.ObjectId, ref: "Campaign" },
        userId: { type: mongoose.Types.ObjectId, ref: "User" },
        email: { type: String },
        phone: { type: Number },
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

export default mongoose.model("userlogs", userlogs);
