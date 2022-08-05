import mongoose from "mongoose";

let product = mongoose.Schema(
    {
        name: String,
        sku: String,
        mobileNumber: Number,
        categoryId: { type: mongoose.Types.ObjectId, ref: "category" },
        brandId: { type: mongoose.Types.ObjectId, ref: "brand" },
        minimumOrderQuantity: { type: Number },
        maxOrderquantity: Number,

        tag: [{ tagId: { type: mongoose.Types.ObjectId, ref: "TagId" } }],
        attribute: [{ attributeId: { type: mongoose.Types.ObjectId, ref: "attribute" } }],

        stockManage: { type: Boolean, default: false },
        productStock: Number,
        sellingPrice: { type: Number, required: true },
        discount: Number,
        discountType: { type: String, required: true },
        description: String,
        specifications: String,

        //seo info
        metaTitle: String,
        metaDescription: String,
        metaImage: String,
    },
    { timestamps: true }
);
export default mongoose.model("product", product);
