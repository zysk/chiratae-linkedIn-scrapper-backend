import mongoose from "mongoose";

let partner = mongoose.Schema(
    {
        name: String,
        email: String,
        companyName: String,
        phone: String,
        message: String,
    },
    { timestamps: true }
);
export default mongoose.model("partner", partner);
