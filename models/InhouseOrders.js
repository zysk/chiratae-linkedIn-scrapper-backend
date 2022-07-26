import mongoose from "mongoose";
let InhouseOrders = mongoose.Schema(
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
        orderStatus: String,
        isCompeleted: {
            type: Boolean,
            default: false,
        },
        tailorId: {
            type: mongoose.SchemaTypes.ObjectId,
        },
        qcId: {
            type: mongoose.SchemaTypes.ObjectId,
        },
    },
    { timestamps: true }
);
export default mongoose.model("InhouseOrders", InhouseOrders);
