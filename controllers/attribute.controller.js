import authorizeJwt from "../middlewares/auth.middleware";

import attribute from "../models/attribute.model";

export const registerAttribute = async(req, res, next) => {
    try {
        console.log(req.body, "345678i")
        if (await attribute.findOne({ name: req.body.name }).exec())
            throw ({ status: 400, message: ' this exist, use another' });
        await attribute(req.body).save().exec()
        res.status(201).json({ message: 'attribute Registered', success: true });
    } catch (err) {
        next(err);
    }
};
export const getAttribute = async(req, res, next) => {
    try {
        const getAttritube = await attribute.find().exec();
        res.status(200).json({ message: "getAttritube", data: getAttritube, success: true });
    } catch (err) {
        next(err);
    }
};
export const updateById = async(req, res, next) => {
    try {
        if (await attribute.findOne({ name: req.body.name }).exec())
            throw ({ status: 400, message: ' attribute exist ' });
        const attributeObj = await attribute.findByIdAndUpdate(req.params.id, req.body).exec();
        if (!attributeObj) throw ({ status: 400, message: "attribute  Not Found" });
        res.status(200).json({ message: "attribute Updated", success: true });
    } catch (err) {
        next(err);
    }
};
export const deleteById = async(req, res, next) => {
    try {
        const attributeObj = await attribute.findByIdAndDelete(req.params.id).exec();
        if (!attributeObj) throw ({ status: 400, message: "attribute Not Found" });
        res.status(200).json({ message: "attribute Deleted", success: true });
    } catch (err) {
        next(err);
    }
};