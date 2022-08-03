import mongoose from "mongoose";

let category = mongoose.Schema(
    {
        name: String,
        slug: String,
        icon: String,
        searchable: { type: Boolean, default: false },
        status: { type: Boolean, default: false },
        categoryImage: String,
        parentCategoryId: String, //direct parent id
        parentCategoryArr: [
            {
                parentId: String,
            },
        ],
        order: {
            type: Number,
            required: true,
        },
        level: {
            type: Number,
            default: 1,
        },
    },
    { timestamps: true }
);

export default mongoose.model("category", category);
