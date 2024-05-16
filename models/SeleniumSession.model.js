import mongoose from "mongoose";

let SeleniumSession = mongoose.Schema(
    {
        session_id: String,
        sessiong_data: Object,
        capabilities: Object,
    },
    { timestamps: true }
);

export default mongoose.model("SeleniumSession", SeleniumSession);
