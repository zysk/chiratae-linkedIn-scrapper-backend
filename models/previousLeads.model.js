import mongoose from "mongoose";
import { rolesObj } from "../helpers/utils/Constants";

let PreviousLeads = mongoose.Schema(
    {
        /////common fields
        name: String,
        /////user fields
        email: { type: String },
        phone: { type: Number },
        ////////client fields
        link: String,
        rating: String,
        educationArr: Array,
        experienceArr: Array,
        contactInfoArr: Array,
        location: String,
        currentPosition: String,
        campaignName: String,
        campanignId: String,
        searchQuery: String,
        accountName: String,
        searchedSchool: String,
        searchedCompany: String,
        totalResults: String,
    },
    { timestamps: true }
);

export default mongoose.model("PreviousLeads", PreviousLeads);
