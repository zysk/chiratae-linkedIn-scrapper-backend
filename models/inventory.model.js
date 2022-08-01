import mongoose from "mongoose";

let inventory = mongoose.Schema({
    productId: { type: mongoose.Types.ObjectId, ref: 'product' },
    stock: { type: Number, required: true },

}, { timestamps: true });

export default mongoose.model("inventory", inventory);