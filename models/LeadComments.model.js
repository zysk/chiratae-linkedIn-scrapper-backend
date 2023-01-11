import mongoose from "mongoose";

let LeadComments = mongoose.Schema(
    {
        leadId: { type: mongoose.Types.ObjectId, ref: "lead" },
        createdBy: { type: mongoose.Types.ObjectId, ref: "User" },
        message: String,
    },
    { timestamps: true }
);

export default mongoose.model("LeadComments", LeadComments);