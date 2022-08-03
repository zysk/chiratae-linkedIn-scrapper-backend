import authorizeJwt from "../middlewares/auth.middleware";

import category from "../models/category.model";

export const registerCategory = async(req, res, next) => {
    try {
        console.log(req.body)
        const nameFound = await category.findOne({ name: req.body.name }).exec();
        if (nameFound) throw ({ status: 400, message: ' catogory  exist ' });

        await category(req.body).save();
        res.status(201).json({ message: 'category Registered', success: true });

    } catch (err) {
        next(err);
    }
};
export const getCategory = async(req, res, next) => {
    try {
        const getCategory = await category.find().exec();
        // console.log(getCategory, "efnwfnewfo")
        res.status(200).json({ message: "getCategory", data: getCategory, success: true });
    } catch (err) {
        next(err);
    }
};

export const updateById = async(req, res, next) => {
    try {
        console.log(req.body, "pyuio")
        const categoryName = await category.findOne({ name: req.body.name }).exec()
        if (categoryName) throw ({ status: 400, message: `this ${req.body.name} category exist` });
        const categoryObj = await category.findByIdAndUpdate(req.params.id, req.body).exec();
        if (!categoryObj) throw ({ status: 400, message: "category  Not Found" });
        res.status(200).json({ message: "category Updated", success: true });
    } catch (err) {
        next(err);
    }
};
export const deleteById = async(req, res, next) => {
    try {
        const categoryObj = await category.findByIdAndDelete(req.params.id).exec();
        if (!categoryObj) throw ({ status: 400, message: "category Not Found" });
        res.status(200).json({ message: "category Deleted", success: true });
    } catch (err) {
        next(err);
    }
};