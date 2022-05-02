import mongoose from "mongoose";
let FabricStockLogs = mongoose.Schema(
    {
        fabricId: String,
        previousStock: Number,
        stock: Number,
        orderId: String,
        description: [String],
    },
    { timestamps: true }
);
export default mongoose.model("FabricStockLogs", FabricStockLogs);
