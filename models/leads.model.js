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
        farmSize: String,
        type: String,
    },
    { timestamps: true }
);
export default mongoose.model("lead", lead);
