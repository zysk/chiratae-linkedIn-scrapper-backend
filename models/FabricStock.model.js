import mongoose from "mongoose";
let FabricStock = mongoose.Schema(
    {
        fabricId: String,
        Stock: Number,
    },
    { timestamps: true }
);
export default mongoose.model("FabricStock", FabricStock);
