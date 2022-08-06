import contactMail from "../models/contactMail.model";
import { isValid, ValidateEmail } from "../helpers/Validators";

export const addMail = async(req, res, next) => {
    try {
        let found = await contactMail.find({ email: req.body.email }).lean().exec();
        console.log(found, "ppppp");
        if (found.length > 0) throw new Error('you already send mail');

        if (!req.body.name) throw new Error("name is mandatory");
        if (!isValid(req.body.name)) throw new Error('name cant be empty');
        req.body.name.trim();

        if (!req.body.email) throw new Error("email is mandatory");
        if (!ValidateEmail(req.body.email)) throw new Error('email invalid ,give valid email');

        const obj = {
            name: req.body.name,
            email: req.body.email,
            message: req.body.message,
        };
        let newMail = await new contactMail(obj).save();
        res.status(200).json({ message: "mail Successfully send", success: true });
    } catch (err) {
        next(err);
    }
};

export const getMail = async(req, res, next) => {
    try {
        let arr = await contactMail.find().lean().exec();
        res.status(200).json({ message: "getMail", data: arr, success: true });
    } catch (err) {
        next(err);
    }
};

export const deleteById = async(req, res, next) => {
    try {
        const obj = await contactMail.findByIdAndDelete(req.params.id).exec();
        if (!obj) throw { status: 400, message: "mail Not Found" };
        res.status(200).json({ message: "mail Deleted", success: true });
    } catch (err) {
        next(err);
    }
};