import LinkedInAccounts from "../models/LinkedInAccounts.model";
// import { upload } from "../helpers/fileUpload";

export const createNewLinkedInAccount = async (req, res, next) => {
    try {
        let existsCheck = await LinkedInAccounts.findOne({ name: req.body.name, password: req.body.password }).exec();
        if (existsCheck) {
            throw new Error("LinkedInAccount Already Exists with same name or password !");
        }
        let newLinkedInAccount = await new LinkedInAccounts(req.body).save();
        res.status(200).json({ message: "LinkedIn account Created", success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};

export const getLinkedInAccounts = async (req, res, next) => {
    try {
        let LinkedInAccountsArr = await LinkedInAccounts.find().exec();
        res.status(200).json({ message: "LinkedInAccounts found", data: LinkedInAccountsArr, success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};

export const deleteLinkedInAccount = async (req, res, next) => {
    try {
        let LinkedInAccountObj = await LinkedInAccounts.findByIdAndDelete(req.params.id).exec();
        if (!LinkedInAccountObj) throw { status: 400, message: "LinkedInAccount not found or deleted already" };
        res.status(200).json({ message: "LinkedInAccount deleted successfully", success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};
