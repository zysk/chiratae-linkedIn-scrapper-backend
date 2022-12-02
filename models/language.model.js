import mongoose from "mongoose";

let language = mongoose.Schema(
    {
        name: String,
        shortName: String,
        isActive: { type: Boolean, default: false },
    },
    { timestamps: true }
);

export default mongoose.model("language", language);
