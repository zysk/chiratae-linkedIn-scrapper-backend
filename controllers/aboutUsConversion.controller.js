import AboutPageConversion from "../models/AboutPageConversion.model";
import Language from "../models/language.model";

export const AddAboutConversion = async (req, res, next) => {
    try {

        let tempArr = req.body;
        for (const el of tempArr) {
            let conversionObj = await AboutPageConversion.findOne({ languageId: el.languageId }).exec()
            if (conversionObj) {
                await AboutPageConversion.findOneAndUpdate({ languageId: el.languageId }, el).exec()
            }
            else {
                await new AboutPageConversion(el).save()
            }
        }
        res.status(200).json({ message: "About Page Conversion created", success: true });
    }
    catch (error) {
        console.error(error);
        next(error);
    }
};




export const getAboutPageConversions = async (req, res, next) => {
    try {
        let query = {}
        if (req.query.isActive) {
            query = { ...query, isActive: req.query.isActive }
        }

        let LanguageArr = await Language.find(query).exec()

        let ConversionArr = await AboutPageConversion.find({ languageId: { $in: [...LanguageArr.map(el => el._id)] } }).exec();

        res.status(200).json({ message: "About Page Conversion found", data: ConversionArr, success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};


















































































