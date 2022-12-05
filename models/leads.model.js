import mongoose from "mongoose";

let lead = mongoose.Schema(
    {
        name: String,
        email: String,
        phone: String,
        message: String,
        businessType: {
            value: String,
            label: String,
        },
        productId: String,
        farmSize: String,
        type: String,
        status: { type: String, default: "Created" },
    },
    { timestamps: true }
);
export default mongoose.model("lead", lead);
