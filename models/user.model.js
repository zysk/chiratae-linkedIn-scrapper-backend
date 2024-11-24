import mongoose from "mongoose";
import { rolesObj } from "../helpers/utils/Constants";

let User = mongoose.Schema(
    {
        // common fields
        name: String,
        isActive: { type: Boolean, default: false },
        role: {
            type: String,
            default: rolesObj.USER,
        },

        searchCompleted: { type: Boolean, default: false },
        // user fields
        campaignId: { type: mongoose.Types.ObjectId, ref: "campaignId" },
        email: { type: String },
        phone: { type: Number },
        employeeId: String,
        password: String,
        // client fields
        link: String,
        educationArr: Array,
        experienceArr: Array,
        contactInfoArr: Array,
        location: String,
        currentPosition: String,
        rating: String,
        mailSettingsObj: {
            mailHost: String,
            mailPort: String,
            mailUserName: String,
            mailUserPassword: String,
            mailEncryption: String,
            mailService: String,
        },
    },
    { timestamps: true }
);

export default mongoose.model("User", User);
