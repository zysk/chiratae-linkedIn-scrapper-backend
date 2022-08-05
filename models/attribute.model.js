import mongoose from "mongoose";

let attribute = mongoose.Schema(
    {
        name: { type: String },
        description: String,
        attributeValueIdArr: {
            type: mongoose.Types.ObjectId,
        },
    },
    { timestamps: true }
);

export default mongoose.model("attribute", attribute);
