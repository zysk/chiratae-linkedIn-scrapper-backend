import mongoose from "mongoose";

let category = mongoose.Schema(
    {
        name: String,
        slug: String,
        icon: String,
        searchable: { type: Boolean, default: false },
        status: { type: Boolean, default: false },
        categoryImage: String,
        // seoTags:[{
        //     tag:String
        // }]
        //add new keys here 
    },
    { timestamps: true }
);

export default mongoose.model("category", category);
