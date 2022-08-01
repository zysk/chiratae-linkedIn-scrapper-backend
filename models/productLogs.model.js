import mongoose from "mongoose";

let logs = mongoose.Schema({
    productId: { type: mongoose.Types.ObjectId, ref: 'product' },

    quantity: { type: Number, },
    stock: { type: Number },
}, { timestamps: true });

export default mongoose.model("logs", logs);