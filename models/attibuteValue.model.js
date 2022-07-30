import mongoose from "mongoose";

let attributeValue = mongoose.Schema(
    {
        attributeId: {type:mongoose.Types.ObjectId,ref:'attribute'},
        value: String

    },
    { timestamps: true }
);
export default mongoose.model("attributeValue", attributeValue);