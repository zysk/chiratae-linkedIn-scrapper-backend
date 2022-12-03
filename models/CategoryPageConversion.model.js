import mongoose from "mongoose";

let categoryConversion = mongoose.Schema(
    {
        languageId: { type: mongoose.Types.ObjectId },
        languageName: String,
        findProduct: String,
        whatisanFMS: String,
        whatisanFMSDescription: String,
        farmingNeeds: String,
        pricing: String,
        farmType: String,
        targetUser: String,
        farmSize: String,
        language: String,
        technology: String,
        farmManagementSoftware: String,
        home: String,
        readLess: String,
        readMore: String,
        ascending: String,
        descending: String,
        compare: String,
        compareSolution: String,
    },
    { timestamps: true }
);
export default mongoose.model("categoryConversion", categoryConversion);
