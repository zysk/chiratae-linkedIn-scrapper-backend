import mongoose from "mongoose";

let partnerConversion = mongoose.Schema(
    {
        languageId: { type: mongoose.Types.ObjectId },
        languageName: String,
        becomeasupplier: String,
        howitWork: String,
        getListed: String,
        getListedDescription: String,
        getQualifiedLeads: String,
        getQualifiedLeadsDescription: String,
        startEarning: String,
        startEarningDescription: String,
        ourPartners: String,
        benefitsforYou: String,
        benefitsforYouPoint1: String,
        benefitsforYouPoint2: String,
        benefitsforYouPoint3: String,
        benefitsforYouPoint4: String,
        companyName: String,
        contactUs: String,
        faq: String,
        faq1: String,
        faq1Value: String,
        faq2: String,
        faq2Value: String,
        faq3: String,
        faq3Value: String,
    },
    { timestamps: true }
);
export default mongoose.model("partnerConversion", partnerConversion);
