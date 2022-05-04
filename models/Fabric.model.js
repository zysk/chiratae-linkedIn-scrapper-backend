import mongoose from "mongoose";

let Fabric = mongoose.Schema(
    {
        length: Number, //in cm
        price: Number, //in Rs
        name: String,
        brand: String,
        articleNo: String,
        colorNo: String,
        colorName: String,
        blend: String,
        fabricPicture: String,
        fabricTagPicture: String,
    },
    { timestamps: true }
);

export default mongoose.model("Fabric", Fabric);
