import mongoose from "mongoose";
let CustomerMeasurement = mongoose.Schema(
    {
        customerId: String,
        productId: String,
        measurementProductId: String,
        detailsArr: [
            {
                name: String,
                value: String,
            },
        ],
    },
    { timestamps: true }
);
export default mongoose.model("CustomerMeasurement", CustomerMeasurement);
