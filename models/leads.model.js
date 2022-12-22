import mongoose from "mongoose";
import { rolesObj } from "../helpers/Constants";

let lead = mongoose.Schema(
    {
        clientId: String,
        campaignId: String,
        status: {
            type: String,
            default: "CREATED"
        },
    },
    { timestamps: true }
);
export default mongoose.model("lead", lead);
