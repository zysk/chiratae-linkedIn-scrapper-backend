import mongoose from "mongoose";

let product = mongoose.Schema({
    productType: { type: String, required: true },
    name: String,
    productSku: String,
    mobileNumber: Number,
    category: { type: mongoose.Types.ObjectId, ref: 'category' },
    brand: { type: mongoose.Types.ObjectId, ref: 'brand' },
    barcodeType: { type: String, },
    minimumOrderQuantity: { type: Number, required: true },
    maxOrderquantity: Number,
    // tags: [
    //     {
    //         _id:false,
    //         tagId:String}
    // ],///    doubt 
    tag: [{ tagId: { type: mongoose.Types.ObjectId, ref: 'TagId' } }],
    attribute: [{ attributeId: { type: mongoose.Types.ObjectId, ref: 'attribute' } }],

    //isphysical product
    //Price Info And Stock

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
    metaImage: String
}, { timestamps: true });
export default mongoose.model("product", product);