import mongoose from "mongoose";

let language = mongoose.Schema(
    {
        name: String,
        isActive: { type: Boolean, default: false },
    },
    { timestamps: true }
);

export default mongoose.model("language", language);
