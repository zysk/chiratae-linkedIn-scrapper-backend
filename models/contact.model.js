import mongoose from "mongoose";

let contact = mongoose.Schema(
    {
        name: String,
        email: String,
        phone: String,
        message: String,
    },
    { timestamps: true }
);
export default mongoose.model("contact", contact);
