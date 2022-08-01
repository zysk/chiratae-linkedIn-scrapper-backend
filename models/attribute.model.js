import mongoose from "mongoose";

let attribute = mongoose.Schema({
    name: { type: String, required: true },
    description: String,
    colorType: { type: Boolean, default: false } //acive or inactive     

}, { timestamps: true });

export default mongoose.model("attribute", attribute);