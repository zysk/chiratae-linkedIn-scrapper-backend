import authorizeJwt from "../middlewares/auth.middleware";
import { storeFileAndReturnNameBase64 } from "../helpers/fileSystem";

import banner from "../models/banner.model";
import { upload } from "../helpers/fileUpload"
export const registerBanner = async(req, res, next) => {
    try {
        if (req.body.image) {
            req.body.image = await storeFileAndReturnNameBase64(req.body.image);
        }
        if (req.body.slide) {
            req.body.slide = await storeFileAndReturnNameBase64(req.body.slide);
        }
        if (req.body.url) {
            let foundUrl = await banner.findOne({ url: req.body.url }).exec()
            if (foundUrl) throw ({ status: 400, message: "url already registered" });
        }
        let bannerObj = await banner(req.body).save().exec()

        console.log(bannerObj)
        res.status(201).json({ message: 'banner Registered', success: true });
    } catch (err) {
        next(err);
    }
};

export const getBanner = async(req, res, next) => {
    try {
        const getBanner = await banner.find().exec();
        console.log(getBanner, "pp")
        res.status(200).json({ message: "getBanner", data: getBanner, success: true });
    } catch (err) {
        next(err);
    }
};
export const updateById = async(req, res, next) => {
    try {
        // const { banner, image } = req.body
        if (req.body.image) {
            req.body.image = await storeFileAndReturnNameBase64(req.body.image);
        }
        if (req.body.slide) {
            req.body.slide = await storeFileAndReturnNameBase64(req.body.slide);
        }
        // if (req.body.url) {
        //     let foundUrl = await banner.findOne({ url: req.body.url })
        //     if (foundUrl) throw ({ status: 400, message: "url already registered" });
        // }
        const bannerObj = await banner.findByIdAndUpdate(req.params.id, req.body, { new: true }).exec();
        if (!bannerObj) throw ({ status: 400, message: "banner Not Found" });
        console.log(bannerObj)
        res.status(200).json({ message: "banner Updated", success: true });
    } catch (err) {
        next(err);
    }
};
export const deleteById = async(req, res, next) => {
    try {
        const bannerObj = await banner.findByIdAndDelete(req.params.id).exec();
        if (!bannerObj) throw ({ status: 400, message: "banner Not Found" });
        res.status(200).json({ message: "banner Deleted", success: true });
    } catch (err) {
        next(err);
    };
}