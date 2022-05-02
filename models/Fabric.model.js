import mongoose from "mongoose";

let Fabric = mongoose.Schema(
    {
        length: Number, //in cm
        price: Number, //in Rs
        name: String,
    },
    { timestamps: true }
);

export default mongoose.model("Fabric", Fabric);
