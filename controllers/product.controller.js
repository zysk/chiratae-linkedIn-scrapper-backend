// import authorizeJwt from "../middlewares/auth.middleware";

import product from "../models/product.model";
import category from "../models/category.model";
import tag from "../models/tag.model";
export const registerProduct = async(req, res, next) => {
    try {
        if (await product.findOne({ $or: [{ category: req.body.category }, { name: req.body.name }] }))
            throw ({ status: 400, message: ' this exist, use another' });
        if (req.body.category) {
            let categoryObj = await category.findById(req.body.category);
            req.body.category = categoryObj._id
        }
        if (req.body.tag) {
            let tagObj = await tag.findById(req.body.tag);
            req.body.tag = tagObj._id
        }
        // if (await product.find({ tags: { $elemMatch: { tagId: req.body.tags[0].tagId } } }).pretty())
        //     throw ({ status: 400, message: ' this tag exist, use another' });
        await product(req.body).save()

        res.status(201).json({ message: 'product Registered', success: true });
    } catch (err) {
        next(err);
    }
};
export const getProduct = async(req, res, next) => {
    try {
        const getProduct = await product.find().exec();
        res.status(200).json({ message: "getProduct", data: getProduct, success: true });
    } catch (err) {
        next(err);
    }
};
export const updateById = async(req, res, next) => {
    try {
        if (await product.findOne({ $or: [{ category: req.body.category }, { name: req.body.name }] }))
            throw ({ status: 400, message: ' this exist, use another' });
        const productObj = await product.findByIdAndUpdate(req.params.id, req.body).exec();
        if (!productObj) throw ({ status: 400, message: "product  Not Found" });
        res.status(200).json({ message: "product Updated", success: true });
    } catch (err) {
        next(err);
    }
};
export const deleteById = async(req, res, next) => {

    try {
        const productObj = await product.findByIdAndDelete(req.params.id).exec();
        if (!productObj) throw ({ status: 400, message: "product Not Found" });
        res.status(200).json({ message: "product Deleted", success: true });
    } catch (err) {
        next(err);
    }
};