import mongoose from "mongoose";
import { generalModelStatuses, rolesObj } from "../helpers/Constants";

let Campaign = mongoose.Schema(
    {
        name: String,
        searchQuery: String,
        accountName: String,
        proxyId: String,
        linkedInAccountId: String,
        password: String,
        totalResults: String,
        school: String,
        company: String,
        totalResults: String,
        scheduled: {
            type: Boolean,
            default: false,
        },
        scheduleDate: {
            type: Date,
        },
        status: {
            type: String,
            default: generalModelStatuses.CREATED
        },
        isSearched: {
            type: Boolean,
            default: false
        },
        resultsArr: [
            {
                clientId: String,
            },
        ],
    },
    { timestamps: true }
);

export default mongoose.model("Campaign", Campaign);
