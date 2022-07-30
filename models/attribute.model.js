import mongoose from "mongoose";

let attribute = mongoose.Schema(
    {
        name: {type:String,required:true},
        description: String,
        status: Boolean,//acive or inactive     
               
    },
    { timestamps: true }
);

export default mongoose.model("attribute", attribute);
