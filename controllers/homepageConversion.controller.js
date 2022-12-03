import HomepageConversion from "../models/homepageConversion.model";
import Language from "../models/language.model";

export const AddHomePageConversion = async (req, res, next) => {
    try {

        let tempArr = req.body;
        for (const el of tempArr) {
            let conversionObj = await HomepageConversion.findOne({ languageId: el.languageId }).exec()
            if (conversionObj) {
                await HomepageConversion.findOneAndUpdate({ languageId: el.languageId }, el).exec()
            }
            else {
                await new HomepageConversion(el).save()
            }
        }
        res.status(200).json({ message: "Home Page Conversion created", success: true });
    }
    catch (error) {
        console.error(error);
        next(error);
    }
};




export const getHomepagePageConversions = async (req, res, next) => {
    try {
        let query = {}
        if (req.query.isActive) {
            query = { ...query, isActive: req.query.isActive }
        }

        let LanguageArr = await Language.find(query).exec()

        let ConversionArr = await HomepageConversion.find({ languageId: { $in: [...LanguageArr.map(el => el._id)] } }).exec();

        res.status(200).json({ message: "Home Page Conversion found", data: ConversionArr, success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};


















































































