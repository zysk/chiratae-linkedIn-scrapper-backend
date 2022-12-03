import CategorypageConversion from "../models/CategoryPageConversion.model";
import Language from "../models/language.model";

export const AddCategorypageConversion = async (req, res, next) => {
    try {

        let tempArr = req.body;
        for (const el of tempArr) {
            let conversionObj = await CategorypageConversion.findOne({ languageId: el.languageId }).exec()
            if (conversionObj) {
                await CategorypageConversion.findOneAndUpdate({ languageId: el.languageId }, el).exec()
            }
            else {
                await new CategorypageConversion(el).save()
            }
        }
        res.status(200).json({ message: "Category Page Conversion created", success: true });
    }
    catch (error) {
        console.error(error);
        next(error);
    }
};




export const getCategoryPageConversions = async (req, res, next) => {
    try {
        let query = {}
        if (req.query.isActive) {
            query = { ...query, isActive: req.query.isActive }
        }

        let LanguageArr = await Language.find(query).exec()

        let ConversionArr = await CategorypageConversion.find({ languageId: { $in: [...LanguageArr.map(el => el._id)] } }).exec();

        res.status(200).json({ message: "Category Page Conversion found", data: ConversionArr, success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};


















































































