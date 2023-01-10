import mongoose from "mongoose";
import { rolesObj } from "../helpers/Constants";

let lead = mongoose.Schema(
    {
        clientId: { type: mongoose.Types.ObjectId, ref: "User" },
        campaignId: { type: mongoose.Types.ObjectId, ref: "Campaign" },
        leadAssignedToId: { type: mongoose.Types.ObjectId, ref: "User" },
        status: {
            type: String,
            default: "CREATED"
        },
    },
    { timestamps: true }
);
export default mongoose.model("lead", lead);
