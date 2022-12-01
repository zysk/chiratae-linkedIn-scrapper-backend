import Partner from "../models/partner.model";

export const Addpartner = async (req, res, next) => {
    try {
        let PartnerObj = await Partner.findOne({ name: new RegExp(`^${req.body.name}$`) }).exec();
        if (PartnerObj) {
            throw new Error("You are already a partner")
        }
        await new Partner(req.body).save();
        res.status(200).json({ message: "Thank you for Partnering with us,  we will reach out to you soon !", success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};


export const getpartners = async (req, res, next) => {
    try {
        let partnerArr = await Partner.find().exec();
        res.status(200).json({ message: "partners found", data: partnerArr, success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};
