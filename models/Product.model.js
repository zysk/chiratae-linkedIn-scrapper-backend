import mongoose from "mongoose";
let Product = mongoose.Schema(
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
export default mongoose.model("Product", Product);
