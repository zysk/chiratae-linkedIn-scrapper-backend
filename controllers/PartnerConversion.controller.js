import PartnerPageConversion from "../models/PartnerPageConversion.model";
import Language from "../models/language.model";

export const AddPartnerConversion = async (req, res, next) => {
    try {
        let tempArr = req.body;
        for (const el of tempArr) {
            let conversionObj = await PartnerPageConversion.findOne({ languageId: el.languageId }).exec()
            if (conversionObj) {
                await PartnerPageConversion.findOneAndUpdate({ languageId: el.languageId }, el).exec()
            }
            else {
                await new PartnerPageConversion(el).save()
            }
        }
        res.status(200).json({ message: "Partner Page Conversion saved", success: true });
    }
    catch (error) {
        console.error(error);
        next(error);
    }
};




export const getPartnerPageConversions = async (req, res, next) => {
    try {
        let query = {}
        if (req.query.isActive) {
            query = { ...query, isActive: req.query.isActive }
        }

        let LanguageArr = await Language.find(query).exec()

        let ConversionArr = await PartnerPageConversion.find({ languageId: { $in: [...LanguageArr.map(el => el._id)] } }).exec();

        res.status(200).json({ message: "Partner Page Conversion found", data: ConversionArr, success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};


















































































