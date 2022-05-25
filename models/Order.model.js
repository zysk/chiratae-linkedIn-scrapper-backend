import mongoose from "mongoose";
import { MainOrderStatus } from "../helpers/OrderStatus";
import User from "./users.model";
// import Product
let Order = mongoose.Schema(
    {
        customerId: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: User,
        },
        salesId: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: User,
        },
        deliveryDate: String,
        orderStatusArr: [
            {
                status: {
                    type: String,
                    default: MainOrderStatus.TRANSFERED_TO_FABRICCUTTER,
                },
                statusChangedByRole: String,
                statusChangedBy: String,
                statusChangedAt: {
                    type: Date,
                    default: new Date(),
                },
            },
        ],
        price: Number,
        patternImage: String,
        jobCardImage: String,
        finalOrderProductArr: [
            {
                productId: String,
                productName: String,
                productIdArr: [
                    {
                        fabricLength: Number,
                        fabricId: String,
                        measurementProductId: String,
                        name: String,
                        detailsArr: [
                            {
                                name: String,
                                value: String,
                                detailId: String,
                            },
                        ],
                    },
                ],
            },
        ],
        orderStatus: {
            type: String,
            default: MainOrderStatus.TRANSFERED_TO_FABRICCUTTER,
        },
    },
    { timestamps: true }
);
module.exports = mongoose.model("Order", Order);
