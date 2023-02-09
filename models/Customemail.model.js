// 
import mongoose from "mongoose";

let customemail = mongoose.Schema(
    {
        email: String,
        subject: String,
        content: String,
    },
    { timestamps: true }
);

export default mongoose.model("customemail", customemail);
