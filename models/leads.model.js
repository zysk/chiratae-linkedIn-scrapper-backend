import mongoose from "mongoose";
import { rolesObj } from "../helpers/utils/Constants";

let lead = mongoose.Schema(
    {
        clientId: { type: mongoose.Types.ObjectId, ref: "User" },
        campaignId: { type: mongoose.Types.ObjectId, ref: "Campaign" },
        leadAssignedToId: { type: mongoose.Types.ObjectId, ref: "User" },
        status: {
            type: String,
            default: "CREATED",
        },
        rating: {
            type: String,
            default: "Low",
        },
        isSearched: { type: Boolean, default: false },
    },
    { timestamps: true }
);
export default mongoose.model("lead", lead);
