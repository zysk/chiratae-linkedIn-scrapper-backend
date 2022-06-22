import mongoose from "mongoose";
let Product = mongoose.Schema(
    {
        name: String,
        productIdArr: [
            {
                productId: mongoose.Schema.Types.ObjectId,
                fabricLength: Number,
            },
        ],
        price: Number,
    },
    { timestamps: true }
);
export default mongoose.model("Product", Product);
