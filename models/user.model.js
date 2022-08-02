import mongoose from "mongoose";
import { rolesObj } from "../helpers/Constants";

let User = mongoose.Schema({
    name: { type: String },
    email: { type: String, required: true },
    phone: { type: Number, required: true, unique: true },
    password: { type: String, required: true },
    age: { type: Number },
    // profilePicture: String,
    city: { type: String, },
    address: { type: String, },
    isActive: { type: Boolean, default: false },
    role: {
        type: String,
        default: rolesObj.USER,
    },
    penNo: { type: String, },
    aadharNo: { type: Number, },
    penCardImage: { type: String, },
    aadharImage: { type: String, },
    kycStatus: { type: String, default: 'pending', enum: ['pending', 'approve', 'denied'] },

}, { timestamps: true });

export default mongoose.model("User", User);