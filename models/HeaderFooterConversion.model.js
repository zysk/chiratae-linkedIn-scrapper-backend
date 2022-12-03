import mongoose from "mongoose";

let headerFooterConversion = mongoose.Schema(
    {
        languageId: { type: mongoose.Types.ObjectId },
        languageName: String,
        product: String,
        becomeapartner: String,
        about: String,
        findProduct: String,
        ceressyFooterDescription: String,
        links: String,
        categories: String,
        Newsletter: String,
        subscribe: String,
        allrightsreserved: String,
        privacyPolicy: String,
        termsConditions: String,
        imprint: String,
    },
    { timestamps: true }
);
export default mongoose.model("headerFooterConversion", headerFooterConversion);
