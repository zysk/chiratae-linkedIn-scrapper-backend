//

import { sendCustomMail } from "../helpers/nodeMailer";
import Customemail from "../models/Customemail.model";

export const createcustomemail = async (req, res, next) => {
    try {
        let newElement = await new Customemail(req.body).save();

        await sendCustomMail(req.body.email, req.body.subject, req.body.content);

        res.status(200).json({ message: "Email Sent", success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};

export const getcustomemail = async (req, res, next) => {
    try {
        let customemailArr = await Customemail.find().exec();
        res.status(200).json({ message: "Emails found", data: customemailArr, success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};
