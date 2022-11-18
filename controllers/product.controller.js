// import authorizeJwt from "../middlewares/auth.middleware";

import { storeFileAndReturnNameBase64 } from "../helpers/fileSystem";
import Product from "../models/product.model";
import ProductGroups from "../models/productGroups.model";

export const addProduct = async (req, res, next) => {
    try {
        if (req.body.companyLogo) {
            req.body.companyLogo = await storeFileAndReturnNameBase64(req.body.companyLogo)
        }

        console.log(req.body.productArr[0].media, "req.body.productArr")
        let arr = []

        for (const el of req.body.productArr) {
            let obj = {
                ...req.body,
                ...el
            }
            arr.push(obj)
        }
        let addedProductsArr = await Product.insertMany([...arr]);

        await ProductGroups({ ...req.body, productsArr: addedProductsArr.map(el => ({ productId: el._id })) }).save();

        //handle stock logs here
        // await new StockLogs({}).save()

        res.status(200).json({ message: "Product Added", success: true });
    } catch (err) {
        console.error(err);
        next(err);
    }
};




export const getProducts = async (req, res, next) => {
    try {
        let addedProductsArr = await ProductGroups.find().lean().exec();

        if (req.query.returnProductData) {
            for (const el of addedProductsArr) {
                if (el.productsArr) {
                    for (const ele of el.productsArr) {
                        let productObj = await Product.findById(ele.productId).exec()
                        if (productObj) {
                            ele.productObj = productObj
                        }
                        else {
                            ele.productObj = {}
                        }
                    }
                }
            }
        }

        res.status(200).json({ message: "Products Found", data: addedProductsArr, success: true });
    } catch (err) {
        console.error(err);
        next(err);
    }
};

export const getProductById = async (req, res, next) => {
    try {
        console.log(req.params.id)
        let productGroupsObj = await ProductGroups.findOne({ _id: req.params.id }).lean().exec();
        if (!productGroupsObj) {
            throw new Error("Product Not Found !!");
        }
        if (productGroupsObj.productsArr) {
            for (const ele of productGroupsObj.productsArr) {
                let productObj = await Product.findById(ele.productId).exec()
                if (productObj) {
                    ele.productObj = productObj
                }
                else {
                    ele.productObj = {}
                }
            }
        }

        res.status(200).json({ message: "Products Found", data: productGroupsObj, success: true });
    } catch (err) {
        console.error(err);
        next(err);
    }
};


export const updateProductById = async (req, res, next) => {
    try {
        // console.log(req.params.id)
        // let productObj = await Product.findOne({ _id: req.params.id }).exec();
        // if (!productObj) {
        //     throw new Error("Product Not Found !!");
        // }
        console.log(req.body)


        res.status(200).json({ message: "Products Updated", success: true });
    } catch (err) {
        console.error(err);
        next(err);
    }
};




