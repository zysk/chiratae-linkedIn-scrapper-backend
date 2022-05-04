import mongoose from "mongoose";
let CustomerMeasurement = mongoose.Schema(
    {
        customerId: String,
        productId: String,
        length: Number,
        waist: Number,
        hip: Number,
        bottom: Number,
        sit: Number,
        thigh: Number,
        style: Number,
        sleeves: Number,
        shoulder: Number,
        neck: Number,
        chest: Number,
        inlength: Number,
        trouser: Number,
        lowerChest: Number,
        halfBack: Number,
        rossBack: Number,
    },
    { timestamps: true }
);
export default mongoose.model("CustomerMeasurement", CustomerMeasurement);
