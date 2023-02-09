// 
import mongoose from "mongoose";

let EmailSettings = mongoose.Schema(
    {
        mailFromAddress: String,
        mailFromName: String,
        mailHost: String,
        mailPort: String,
        mailUserName: String,
        mailUserPassword: String,
        mailEncryption: String,
        mailService: String,
    },
    { timestamps: true }
);

export default mongoose.model("EmailSettings", EmailSettings);
