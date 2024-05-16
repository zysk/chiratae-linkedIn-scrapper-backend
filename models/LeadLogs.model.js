import mongoose from "mongoose";

let LeadLogs = mongoose.Schema(
    {
        leadId: { type: mongoose.Types.ObjectId, ref: "lead" },
        value: String,
        previousValue: String,
        message: String,
    },
    { timestamps: true }
);

export default mongoose.model("LeadLogs", LeadLogs);
