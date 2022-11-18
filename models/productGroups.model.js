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
        productType: {
            value: String,
        },
        leadManagerArr: [
            {
                name: String,
                mail: String,
                phone: String,
                country: [{
                    value: String,
                }],
            }
        ],
        productCount: String,
        productsArr: [
            {
                productId: String,
            }
        ],
    },
    { timestamps: true }
);
export default mongoose.model("productGroups", productGroups);