import mongoose from "mongoose";

let attribute = mongoose.Schema(
    {
        name: { type: String },
        description: String,
        attributeValueArr: [
            {
                attributeId: String,
            },
        ],
    },
    { timestamps: true }
);

export default mongoose.model("attribute", attribute);
