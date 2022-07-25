import mongoose from "mongoose";
let QualityControlChecks = mongoose.Schema(
    {
        name: String,
        productArr: [
            {
                productId: String,
            },
        ],
    },
    { timestamps: true }
);
export default mongoose.model("QualityControlChecks", QualityControlChecks);
