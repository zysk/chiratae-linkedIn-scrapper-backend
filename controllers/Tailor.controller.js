import { encryptPassword } from "../helpers/Bcrypt";
import { ErrorMessages } from "../helpers/Constants";
import { storeFileAndReturnNameBase64 } from "../helpers/fileSystem";
import { generateUid } from "../helpers/utils";
import { ValidateEmail } from "../helpers/Validators";
import Tailor from "../models/Tailor.model";
import MeasurementProduct from "../models/MeasurementProduct.model";

export const registerTailor = async (req, res, next) => {
    try {
        let UserExistCheck = await Tailor.findOne({ $or: [{ phone: req.body.phone }, { email: new RegExp(`^${req.body.email}$`) }] });
        if (UserExistCheck) throw new Error(`${ErrorMessages.EMAIL_EXISTS} or ${ErrorMessages.PHONE_EXISTS}`);

        if (!ValidateEmail(req.body.email)) {
            throw new Error(ErrorMessages.INVALID_EMAIL);
        }
        if (req.body.profilePicture) {
            try {
                req.body.profilePicture = await storeFileAndReturnNameBase64(req.body.profilePicture);
            } catch (error) {
                console.error(error);
                req.body.profilePicture = "";
            }
        }

        req.body.uid = await generateUid();

        await new Tailor(req.body).save();

        res.status(200).json({ message: "Tailor Created", success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};

export const getTailors = async (req, res, next) => {
    try {
        const TailorArr = await Tailor.find().lean().exec();
        res.status(200).json({ data: TailorArr, message: "Tailor", success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};

export const updateTailor = async (req, res, next) => {
    try {
        await Tailor.findByIdAndUpdate(req.params.id, req.body, { new: true }).exec();
        res.status(200).json({ success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};
export const deleteTailor = async (req, res, next) => {
    try {
        let tailorObj = await Tailor.findByIdAndRemove(req.params.id).exec();
        res.status(200).json({ data: tailorObj, success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};

export const getSpecificTailor = async (req, res, next) => {
    try {
        console.log(req.query);
        let tailorObj = await Tailor.findOne({ $or: [{ phone: req.query.search }, { uid: req.query.search }] }).exec();
        res.status(200).json({ message: "Tailor", data: tailorObj, success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};

// export const getTailorWithProductId = async (req, res, next) => {
//     try {
//         let tailorArr = await Tailor.find({ "productArr.productId": req.params.productId }).exec();
//         res.status(200).json({ message: "Product", data: tailorArr, success: true });
//     } catch (error) {
//         console.error(error);
//         next(error);
//     }
// };
