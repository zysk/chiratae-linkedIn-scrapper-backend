import mongoose from "mongoose";
import { rolesObj } from "../helpers/utils/Constants";

let LeadStatus = mongoose.Schema(
    {
        value: String,
    },
    { timestamps: true }
);

export default mongoose.model("LeadStatus", LeadStatus);
