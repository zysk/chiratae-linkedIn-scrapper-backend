import mongoose from "mongoose";
import { OrderStatus } from "../helpers/OrderStatus";

let FabricOrder = mongoose.Schema(
    {
        fabricArr: [
            {
                fabricId: String,
                quantity: Number,
                price: Number,
                taxObj: {},
            },
        ],
        subTotal: Number,
        totalAmount: Number,
        status: {
            type: String,
            default: OrderStatus.ORDERED,
        },
        userIdArr: [String],
        addressObj: {},
    },
    { timestamps: true }
);
export default mongoose.model("FabricOrder", FabricOrder);
