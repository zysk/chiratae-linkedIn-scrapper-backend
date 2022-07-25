import QualityControlChecks from "../models/QualityControlChecks.model";
import Product from "../models/Product.model";

export const addQualityControlChecks = async (req, res, next) => {
    try {
        // let existCheck = await QualityControlChecks.findOne({ "productArr.productId": { $in: req.body.productArr.map((el) => el.productId) } }).exec();
        // if (existCheck) throw new Error("Quality Control Check Already Exist");
        await new QualityControlChecks(req.body).save();
        res.status(200).json({ message: "Quality Control Checks", success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};

export const getAllQualityControlChecks = async (req, res, next) => {
    try {
        let qualityControlChecks = await QualityControlChecks.find().lean().exec();
        res.status(200).json({ message: "Quality Control Checks", data: qualityControlChecks, success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};

export const getById = async (req, res, next) => {
    try {
        let Fabric = await QualityControlChecks.findById(req.params.id).lean().exec();
        res.status(200).json({ message: "Fabric ", data: Fabric, success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};

export const updateById = async (req, res, next) => {
    try {
        let qualityControlObj = await QualityControlChecks.findByIdAndUpdate(req.params.id, req.body, { new: true }).exec();
        res.status(200).json({ message: "Updated Successfully", success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};
export const deleteById = async (req, res, next) => {
    try {
        await QualityControlChecks.findByIdAndRemove(req.params.id).exec();
        res.status(200).json({ message: "Deleted Successfuly", success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};
