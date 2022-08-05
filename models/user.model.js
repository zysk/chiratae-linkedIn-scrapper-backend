import mongoose from "mongoose";
import { rolesObj } from "../helpers/Constants";

let User = mongoose.Schema({
    email: { type: String, required: true },
    phone: { type: Number, required: true, unique: true },
    firstName: String,
    lastName: String,
    shopName: String,
    dob: Date,
    country: String,
    stateName: String,
    pincode: String,
    language: String,
    alternatePhone: { type: Number, required: true, unique: true },
    // password: { type: String, required: true },
    city: { type: String, },
    isActive: { type: Boolean, default: false },
    role: {
        type: String,
        default: rolesObj.USER,
    },
    panNo: { type: String, },
    aadharNo: { type: Number, },
    visitingCard: { type: String },
    shopImage: { type: String },
    onlinePortal: { type: String },
    kycStatus: { type: String, default: 'Pending', enum: ['Pending', 'Approve', 'Denied'] },

}, { timestamps: true });

export default mongoose.model("User", User);