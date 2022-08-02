import authorizeJwt from "../middlewares/auth.middleware";

import brand from "../models/brand.model";

export const registerBrand = async(req, res, next) => {
    try {
        if (await brand.findOne({ name: req.body.name }).exec())
            throw ({ status: 400, message: ' this exist, use another' });

        await brand(req.body).save()
        res.status(201).json({ message: 'brand Registered', success: true });
    } catch (err) {
        next(err);
    }
};
export const getBrand = async(req, res, next) => {
    // router.get("/getBrand", async (req, res, next) => {
    try {
        const getBrand = await brand.find().exec();
        res.status(200).json({ message: "getBrand", data: getBrand, success: true });
    } catch (err) {
        next(err);
    }
};
export const updateById = async(req, res, next) => {
    // router.patch("/updateById/:id", authorizeJwt, async (req, res, next) => {
    try {
        if (await brand.findOne({ name: req.body.name }).exec())
            throw ({ status: 400, message: ' brand exist ' });
        const brandObj = await brand.findByIdAndUpdate(req.params.id, req.body).exec();
        if (!brandObj) throw ({ status: 400, message: "brand  Not Found" });
        res.status(200).json({ message: "brand Updated", success: true });
    } catch (err) {
        next(err);
    }
};
export const deleteById = async(req, res, next) => {
    // router.delete("/deleteById/:id", authorizeJwt, async (req, res, next) => {
    try {
        const brandObj = await brand.findByIdAndDelete(req.params.id).exec();
        if (!brandObj) throw ({ status: 400, message: "brand Not Found" });
        res.status(200).json({ message: "brand Deleted", success: true });
    } catch (err) {
        next(err);
    }
};