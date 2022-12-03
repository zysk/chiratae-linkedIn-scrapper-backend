import ProductpageConversion from "../models/ProductPageConversion.model";
import Language from "../models/language.model";

export const AddProductpageConversion = async (req, res, next) => {
    try {

        let tempArr = req.body;
        for (const el of tempArr) {
            let conversionObj = await ProductpageConversion.findOne({ languageId: el.languageId }).exec()
            if (conversionObj) {
                await ProductpageConversion.findOneAndUpdate({ languageId: el.languageId }, el).exec()
            }
            else {
                await new ProductpageConversion(el).save()
            }
        }
        res.status(200).json({ message: "Product Page Conversion created", success: true });
    }
    catch (error) {
        console.error(error);
        next(error);
    }
};




export const getProductPageConversions = async (req, res, next) => {
    try {
        let query = {}
        if (req.query.isActive) {
            query = { ...query, isActive: req.query.isActive }
        }

        let LanguageArr = await Language.find(query).exec()

        let ConversionArr = await ProductpageConversion.find({ languageId: { $in: [...LanguageArr.map(el => el._id)] } }).exec();

        res.status(200).json({ message: "Product Page Conversion found", data: ConversionArr, success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};


















































































