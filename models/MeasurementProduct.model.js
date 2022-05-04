import mongoose from "mongoose";
let MeasurementProduct = mongoose.Schema(
    {
        name: String,
        productIdArr: [
            {
                productId: String,
            },
        ],
        price: Number,
    },
    { timestamps: true }
);
export default mongoose.model("MeasurementProduct", MeasurementProduct);
