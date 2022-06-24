import Product from "../models/Product.model";
import MeasurementProduct from "../models/MeasurementProduct.model";
import mongoose from "mongoose";

export const addProduct = async (req, res, next) => {
    try {
        await new Product(req.body).save();
        res.status(200).json({ message: "Product Created Successfully", success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};
export const getAllProducts = async (req, res, next) => {
    try {
        let products = await Product.find().exec();
        res.status(200).json({ data: products, success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};

export const updateProduct = async (req, res, next) => {
    try {
        await Product.findByIdAndUpdate(req.params.id, req.body, { new: true }).exec();
        res.status(200).json({ success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};
export const deleteProduct = async (req, res, next) => {
    try {
        let productObj = await Product.findByIdAndRemove(req.params.id).exec();
        res.status(200).json({ data: productObj, success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};

export const getAllProductsWithMeasurement = async (req, res, next) => {
    try {
        let products = await Product.find().lean().exec();
        // console.log(products);
        let measurementProductsArr = await MeasurementProduct.find().lean().exec();
        let finalArr = products.map((product) => {
            return {
                ...product,
                productIdArr: product.productIdArr.map((productIdObj) => ({ ...productIdObj, measurementProduct: measurementProductsArr.find((measurementProduct) => `${measurementProduct._id}` == `${productIdObj.productId}`) })),
            };
        });
        // console.log(JSON.stringify(finalArr, null, 2));

        // let finalArr = await Product.aggregate([
        //     {
        //         $unwind: {
        //             path: "$productIdArr",
        //             preserveNullAndEmptyArrays: true,
        //         },
        //     },
        //     {
        //         $lookup: {
        //             from: "customermeasurements",
        //             let: {
        //                 measurementProductId: "$productIdArr.productId",
        //                 userId: "mongoose.Types.ObjectId(req.params.id)",
        //             },
        //             pipeline: [
        //                 {
        //                     $match: {
        //                         $expr: {
        //                             $and: [
        //                                 {
        //                                     $eq: ["$measurementProductId", "$$measurementProductId"],
        //                                 },
        //                                 {
        //                                     $eq: ["$customerId", "$$userId"],
        //                                 },
        //                             ],
        //                         },
        //                     },
        //                 },
        //             ],
        //             as: "result",
        //         },
        //     },
        //     {
        //         $unwind: {
        //             path: "$result",
        //             preserveNullAndEmptyArrays: true,
        //         },
        //     },
        //     {
        //         $project: {
        //             _id: "$_id",
        //             name: "$name",
        //             result: {
        //                 fabricLength: "$productIdArr.fabricLength",
        //                 _id: "$result._id",
        //                 customerId: "$result.customerId",
        //                 measurementProductId: "$result.measurementProductId",
        //                 detailsArr: "$result.detailsArr",
        //             },
        //         },
        //     },
        //     {
        //         $group: {
        //             _id: {
        //                 _id: "$_id",
        //                 name: "$name",
        //                 productIdArr: "$productIdArr",
        //             },
        //             results: {
        //                 $push: "$result",
        //             },
        //         },
        //     },
        //     {
        //         $project: {
        //             _id: "$_id._id",
        //             name: "$_id.name",
        //             productIdArr: "$results",
        //         },
        //     },
        // ]).exec();
        console.log(JSON.stringify(finalArr[0], null, 2));
        res.status(200).json({ data: finalArr, message: "Products", success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};
