import mongoose from "mongoose";
let TailorOrderArr = mongoose.Schema(
    {
        orderId: {
            type: mongoose.SchemaTypes.ObjectId,
        },
        productObj: {
            jobCardImage1: String,
            jobCardImage2: String,
            patternImage: String,
            fabricLength: Number,
            fabricId: String,
            measurementProductId: String,
            name: String,
            qualityChecksArr: [
                {
                    qualityCheckId: String,
                    qualityCheckName: String,
                    checked: {
                        type: Boolean,
                        default: false,
                    },
                },
            ],
            detailsArr: [
                {
                    name: String,
                    value: String,
                    detailId: String,
                },
            ],
        },
        isCompleted: {
            type: Boolean,
            default: false,
        },
        completionDate: {
            type: Date,
            default: new Date(),
        },
        tailorId: {
            type: mongoose.SchemaTypes.ObjectId,
        },
    },
    { timestamps: true }
);
export default mongoose.model("TailorOrderArr", TailorOrderArr);
