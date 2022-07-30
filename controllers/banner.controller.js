import authorizeJwt from "../middlewares/auth.middleware";

import banner from "../models/banner.model";
import { upload } from "../helpers/fileUpload"
export const registerBanner = async(req, res, next) => {
    try {

        // console.log(req.file, "req")

        // console.log(req.file, "pppppp")
        // let bannerObj = await banner(req.files).save()
        // console.log(bannerObj)
        res.status(201).json({ message: 'banner Registered', success: true });
    } catch (err) {
        next(err);
    }
};

export const uploadFile = async(req, res, next) => {
    try {
        upload.single('file')
        console.log(req.file.name)
        if (req.file.banner) {
            req.file.banner = await storeFileAndReturnNameBase64(req.file.banner);
        }
        if (req.file.slide) {
            req.file.slide = await storeFileAndReturnNameBase64(req.file.slide);
        }
        if (req.file.image) {
            req.file.image = await storeFileAndReturnNameBase64(req.file.image);
        }
        await Users.findByIdAndUpdate(req.params.id, req.file);
        res.status(201).json({ message: 'banner added succesfully', success: true });
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
        const { banner, image } = req.body
        const bannerObj = await brand.findByIdAndUpdate(req.params.id, { slideslide }, { banner: banner }, { image: image }).exec();
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
    }
};