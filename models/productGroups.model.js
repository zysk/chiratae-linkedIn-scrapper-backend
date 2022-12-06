import mongoose from "mongoose";

let productGroups = mongoose.Schema(
    {
        companyName: String,
        companyMail: String,
        companyPhone: String,
        languageId: String,
        website: String,
        companyLogo: String,
        companyFoundingDate: String,
        companyHqLocation: String,
        companyDescription: String,
        companyRepName: String,
        companyRepMail: String,
        companyRepPhone: String,
        isEnglishModel: {
            type: Boolean,
            default: false,
        },
        companyCountryArr: [
            {
                label: String,
                value: String,
            },
        ],
        productType: {
            value: String,
        },
        productTypeOtherValue: String,
        leadManagerArr: [
            {
                name: String,
                mail: String,
                phone: String,
                country: [
                    {
                        label: String,
                        value: String,
                    },
                ],
            },
        ],
        productCount: String,
        productsArr: [
            {
                productId: String,
            },
        ],
        originalProductArr: [
            {
                productId: String,
            },
        ],
        reviewsArr: [
            {
                url: String,
                name: String,
            },
        ],
    },
    { timestamps: true }
);
export default mongoose.model("productGroups", productGroups);
