// import authorizeJwt from "../middlewares/auth.middleware";

import { storeFileAndReturnNameBase64 } from "../helpers/fileSystem";
import Category from "../models/category.model";
import Brand from "../models/brand.model";
import Tag from "../models/tag.model";
import Inventory from "../models/inventory.model";
import Product from "../models/product.model";

export const addProduct = async (req, res, next) => {
    try {

        let insertedObj = await new Product(req.body).save();

        //handle stock logs here
        // await new StockLogs({}).save()

        res.status(200).json({ message: "Product Added", success: true });
    } catch (err) {
        console.error(err);
        next(err);
    }
};

export const getAllProducts = async (req, res, next) => {
    try {
        let productArr = await Product.find().lean().exec();
        for (let el of productArr) {
            let brandObj = await Brand.findById(el.brandId).exec()
            el.brandObj = brandObj

            let categoryObj = await Category.findById(el.categoryId).exec()
            el.categoryObj = categoryObj

            for (const ele of tagArr) {
                let tagObj = await Tag.findById(ele.tagId).exec()
                ele.tagObj = tagObj

            }
            let stockObj = await Inventory.findOne({ productId: el._id }).lean().exec();
            if (stockObj) {
                el.stock = stockObj.stock;
            } else {
                el.stock = 0;
            }
        }
        res.status(200).json({ message: "products", data: productArr, success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};

// export const deleteProductById = async (req, res, next) => {
//     try {
//     } catch {}
// };

export const updateProductById = async (req, res, next) => {
    try {
        let insertObj = {
            ...req.body,
        };

        let categoryObj = await Category.findById(req.body.categoryId).lean().exec();
        if (!categoryObj) throw new Error("Product Category not found");

        insertObj.parentCategoryIdArr = categoryObj.parentCategoryArr.map((el) => ({ categoryId: el.parentId }));

        if (insertObj.productImageStr) {
            insertObj.productImage = await storeFileAndReturnNameBase64(insertObj.productImageStr);
        }
        if (insertObj.specificationFile) {
            insertObj.productSpecificationFile = await storeFileAndReturnNameBase64(insertObj.specificationFile);
        }

        await Product.findByIdAndUpdate(req.params.id, insertObj).exec();

        await Inventory.findOneAndUpdate(req.params.id, { stock: insertObj.stock }).exec();
        //handle stock logs here
        // await new StockLogs({}).save()

        res.status(200).json({ message: "product Updated", success: true });
    } catch (err) {
        console.error(err);
        next(err);
    }
};

//top 10 product
export const getActiveProducts = async (req, res, next) => {
    try {
        let productArr = await Product.find({ active: true }).lean().exec();
        // console.log(productArr, "ppppppppp")
        res.status(200).json({ message: "products", data: productArr, success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};
export const getProductsPubAndTotal = async (req, res, next) => {
    //total and published product
    try {
        let publishedProducts = 0;
        let totalProducts = 0;

        let productArr = await Product.find().lean().exec();
        totalProducts = productArr.length;
        for (let el of productArr) {
            if (el.active == true) {
                publishedProducts++;
            }
        }
        res.status(200).json({
            message: "products",
            data: { publishedProducts: publishedProducts, totalProducts: totalProducts },
            success: true,
        });
    } catch (error) {
        console.error(error);
        next(error);
    }
};

export const getProductsCategoryWise = async (req, res, next) => {
    //category wise product
    try {
        let getCategoryArr = await Category.find().lean().exec();
        // let found = []
        let obj = {};
        for (let el of getCategoryArr) {
            // let found = await Product.find({ parentCategoryIdArr: { $elemMatch: { categoryId: el._id } } })
            obj[el._id] = ((await Product.find({ parentCategoryIdArr: { $elemMatch: { categoryId: el._id } } }).count()) || 0) + 1;
        }
        res.status(200).json({
            message: "products",
            data: obj,
            success: true,
        });
    } catch (error) {
        console.error(error);
        next(error);
    }
};




export const getCategoryWiseProducts = async (req, res, next) => {
    //category wise product
    try {
        let productsArr = await Product.find({ categoryId: req.params.id }).lean().exec()
        for (const el of productsArr) {
            let brandObj = await Brand.findById(el.brandId).exec()
            el.brandObj = brandObj

            let categoryObj = await Category.findById(el.categoryId).exec()
            el.categoryObj = categoryObj

            for (const ele of tagArr) {
                let tagObj = await Tag.findById(ele.tagId).exec()
                ele.tagObj = tagObj

            }
        }
        res.status(200).json({
            message: "products",
            data: productsArr,
            success: true,
        });
    } catch (error) {
        console.error(error);
        next(error);
    }
};
