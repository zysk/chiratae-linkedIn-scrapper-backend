import mongoose from "mongoose";

let brand = mongoose.Schema(
    {

        name: String,
        description: String,
        websiteLink: String,
        metaTitle: String, //for seo
        metaDescription: String, //for seo
        brandLogo: [String],
        statusInfo: { type: String, required: true },
        isFeatured: Boolean,
      
        // seoTags:[{
        //     tag:String
        // }] ///doubt 

    },
    { timestamps: true }
);

export default mongoose.model("brand", brand);
