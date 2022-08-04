// import authorizeJwt from "../middlewares/auth.middleware";

import Product from "../models/product.model";
import Category from "../models/category.model";
import Inventory from "../models/inventory.model";

import Tag from "../models/tag.model";
import { storeFileAndReturnNameBase64 } from "../helpers/fileSystem";
import StockLogs from "../models/stockLogs.model";
export const addProduct = async (req, res, next) => {
    try {
        let insertObj = {
            ...req.body,
        };
        let skuCheck = await Product.findOne({ sku: new RegExp(`^${req.body.sku}$`) })
            .lean()
            .exec();
        if (skuCheck) throw new Error("Product Already exist with this sku code.");
        let categoryObj = await Category.findById(req.body.categoryId).lean().exec();
        if (!categoryObj) throw new Error("Product Category not found");

        insertObj.parentCategoryIdArr = categoryObj.parentCategoryArr.map((el) => ({ categoryId: el.parentId }));

        if (insertObj.productImageStr) {
            insertObj.productImage = await storeFileAndReturnNameBase64(insertObj.productImageStr);
        }
        if (insertObj.productSpecificationFile) {
            insertObj.productSpecificationFile = await storeFileAndReturnNameBase64(insertObj.productSpecificationFile);
        }

        let insertedObj = await new Product(insertObj).save();

        await new Inventory({ productId: insertedObj._id, stock: insertObj.stock }).save();
        //handle stock logs here
        // await new StockLogs({}).save()

        res.status(200).json({ message: "product Registered", success: true });
    } catch (err) {
        console.error(err);
        next(err);
    }
};

export const getAllProducts = async (req, res, next) => {
    try {
        let productArr = await Product.find().lean().exec();
        res.status(200).json({ message: "products", data: productArr, success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};
