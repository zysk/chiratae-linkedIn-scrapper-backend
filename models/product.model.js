import mongoose from "mongoose";

let product = mongoose.Schema(
    {
        name: String,
        sku: String,
        modelNumber: Number,
        categoryId: { type: mongoose.Types.ObjectId },
        parentCategoryIdArr: [
            {
                categoryId: { type: mongoose.Types.ObjectId },
            },
        ],
        brandId: { type: mongoose.Types.ObjectId },
        minimumOrderQuantity: { type: Number },
        maxOrderquantity: Number,

        tagArr: [{ tagId: { type: mongoose.Types.ObjectId } }],
        // attribute: [{ attributeId: { type: mongoose.Types.ObjectId, ref: "attribute" } }],

        sellingPrice: { type: Number },
        discountValue: Number,
        discountType: { type: String },
        description: String,
        specification: String,

        //seo info
        metaTitle: String,
        metaDescription: String,
        metaImage: String,
    },
    { timestamps: true }
);
export default mongoose.model("product", product);
