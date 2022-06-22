import mongoose from "mongoose";
let CustomerMeasurement = mongoose.Schema(
    {
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
        },
        productId: {
            type: mongoose.Schema.Types.ObjectId,
        },
        measurementProductId: {
            type: mongoose.Schema.Types.ObjectId,
        },
        detailsArr: [
            {
                name: String,
                value: String,
                detailId: {
                    type: mongoose.Schema.Types.ObjectId,
                },
            },
        ],
    },
    { timestamps: true }
);
export default mongoose.model("CustomerMeasurement", CustomerMeasurement);
