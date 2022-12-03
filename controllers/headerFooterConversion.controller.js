import HeaderFooterConversion from "../models/HeaderFooterConversion.model";
import Language from "../models/language.model";

export const AddHeaderFooterConversion = async (req, res, next) => {
    try {

        let tempArr = req.body;
        for (const el of tempArr) {
            let conversionObj = await HeaderFooterConversion.findOne({ languageId: el.languageId }).exec()
            if (conversionObj) {
                await HeaderFooterConversion.findOneAndUpdate({ languageId: el.languageId }, el).exec()
            }
            else {
                await new HeaderFooterConversion(el).save()
            }
        }
        res.status(200).json({ message: "Header Footer Conversion created", success: true });
    }
    catch (error) {
        console.error(error);
        next(error);
    }
};




export const getHeaderFooterConversion = async (req, res, next) => {
    try {
        let query = {}
        if (req.query.isActive) {
            query = { ...query, isActive: req.query.isActive }
        }

        let LanguageArr = await Language.find(query).exec()

        let ConversionArr = await HeaderFooterConversion.find({ languageId: { $in: [...LanguageArr.map(el => el._id)] } }).exec();

        res.status(200).json({ message: "Header Footer Conversion found", data: ConversionArr, success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};


















































































