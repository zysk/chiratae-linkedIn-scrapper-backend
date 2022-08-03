import authorizeJwt from "../middlewares/auth.middleware";

import Attribute from "../models/attribute.model";

export const registerAttribute = async (req, res, next) => {
    try {
        let attributeCheck = await Attribute.findOne({ name: req.body.name }).exec();
        if (attributeCheck) throw { status: 400, message: "Already Exists" };
        let attributeObj = await Attribute(req.body).save().exec();
        if (attributeObj) {
            let attrValueArr = req.body.attributeValueArr.map((el) => ({ ...el, attributeId: attributeObj._id }));
        }
        res.status(201).json({ message: "attribute Registered", success: true });
    } catch (err) {
        next(err);
    }
};
export const getAttribute = async (req, res, next) => {
    try {
        const getAttritube = await Attribute.find().exec();
        res.status(200).json({ message: "getAttritube", data: getAttritube, success: true });
    } catch (err) {
        next(err);
    }
};
export const updateById = async (req, res, next) => {
    try {
        if (await Attribute.findOne({ name: req.body.name }).exec()) throw { status: 400, message: " attribute exist " };
        const attributeObj = await Attribute.findByIdAndUpdate(req.params.id, req.body).exec();
        if (!attributeObj) throw { status: 400, message: "attribute  Not Found" };
        res.status(200).json({ message: "attribute Updated", success: true });
    } catch (err) {
        next(err);
    }
};
export const deleteById = async (req, res, next) => {
    try {
        const attributeObj = await Attribute.findByIdAndDelete(req.params.id).exec();
        if (!attributeObj) throw { status: 400, message: "attribute Not Found" };
        res.status(200).json({ message: "attribute Deleted", success: true });
    } catch (err) {
        next(err);
    }
};
