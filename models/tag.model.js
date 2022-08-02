import mongoose from "mongoose";

let tagId = mongoose.Schema({
    tagName: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model("TagId", tagId);