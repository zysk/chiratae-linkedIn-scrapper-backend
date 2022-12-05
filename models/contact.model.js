import mongoose from "mongoose";

let contact = mongoose.Schema(
    {
        name: String,
        email: String,
        phone: String,
        message: String,
        status: { type: String, default: "Created" },
    },
    { timestamps: true }
);
export default mongoose.model("contact", contact);
