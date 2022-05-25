import Product from "../models/Product.model";
import MeasurementProduct from "../models/MeasurementProduct.model";

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
        let measurementProductsArr = await MeasurementProduct.find().lean().exec();
        console.log(measurementProductsArr);
        let finalArr = products.map((product) => {
            return {
                ...product,
                productIdArr: product.productIdArr.map((productIdObj) => ({ ...productIdObj, measurementProduct: measurementProductsArr.find((measurementProduct) => measurementProduct._id == productIdObj.productId) })),
            };
        });
        console.log(JSON.stringify(finalArr, null, 2));
        res.status(200).json({ data: finalArr, message: "Products", success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};
