import mongoose from "mongoose";
let Product = mongoose.Schema(
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
export default mongoose.model("Product", Product);
