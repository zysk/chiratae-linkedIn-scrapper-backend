import mongoose from "mongoose";
let MeasurementProduct = mongoose.Schema(
    {
        name: String,
        price: Number,
        detailsArr: [
            {
                name: String,
            },
        ],
    },
    { timestamps: true }
);
export default mongoose.model("MeasurementProduct", MeasurementProduct);
