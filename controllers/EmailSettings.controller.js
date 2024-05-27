import EmailSettings from "../models/EmailSettings.model";

export const createNewEmailSettings = async (req, res, next) => {
    try {
        let existsCheck = await EmailSettings.findOne().exec();
		let obj = req.body;
        obj.mailUserPassword = Buffer.from(req.body.mailUserPassword, "base64").toString("ascii");

        if (existsCheck) {
            await EmailSettings.findOneAndUpdate({}, obj).exec();
        } else {
            let newElement = await new EmailSettings(obj).save();
        }
        res.status(200).json({ message: "Email Settings updated", success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};

export const getEmailSettings = async (req, res, next) => {
    try {
        let EmailSettingsObj = await EmailSettings.findOne({}).exec();
        res.status(200).json({ message: "Email Settings found", data: EmailSettingsObj, success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};
