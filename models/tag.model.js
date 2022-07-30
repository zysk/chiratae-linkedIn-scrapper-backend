import mongoose from "mongoose";

let tagId = mongoose.Schema(
    {
        tagName: String,
    },
    { timestamps: true }
);

export default mongoose.model("TagId", tagId);
