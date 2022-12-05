import mongoose from "mongoose";

let partner = mongoose.Schema(
    {
        name: String,
        email: String,
        companyName: String,
        phone: String,
        message: String,
        status: { type: String, default: "Created" },
    },
    { timestamps: true }
);
export default mongoose.model("partner", partner);
