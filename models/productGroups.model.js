import mongoose from "mongoose";

let productGroups = mongoose.Schema(
    {
        companyName: String,
        companyMail: String,
        companyPhone: String,
        website: String,
        companyLogo: String,
        companyFoundingDate: String,
        companyHqLocation: String,
        companyDescription: String,
        companyRepName: String,
        companyRepMail: String,
        companyRepPhone: String,
        companyCountryArr: [
            {
                label: String,
                value: String,
            }
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
                    }
                ],
            }
        ],
        productCount: String,
        productsArr: [
            {
                productId: String,
            }
        ],
        reviewsArr: [
            {
                url: String,
                name: String,
            }
        ]
    },
    { timestamps: true }
);
export default mongoose.model("productGroups", productGroups);