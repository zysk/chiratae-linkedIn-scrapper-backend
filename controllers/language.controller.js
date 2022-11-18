import Language from "../models/language.model";

export const AddLanguage = async (req, res, next) => {
    try {
        console.log(req.body)
        console.log(new RegExp(`^${req.body.name}$`))
        let LanguageObj = await Language.findOne({ name: new RegExp(`^${req.body.name}$`) }).exec();
        if (LanguageObj) {
            throw new Error("Already hava a language with same name");
        }

        await new Language(req.body).save();

        res.status(200).json({ message: "Language created", success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};


export const getLanguages = async (req, res, next) => {
    try {

        let query = {}

        if (req.query.isActive) {
            query = { ...query, isActive: req.query.isActive }
        }

        let LanguageArr = await Language.find(query).exec();

        res.status(200).json({ message: "Languages found", data: LanguageArr, success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};


export const updateLanguage = async (req, res, next) => {
    try {
        console.log(req.body)
        let LanguageExistsObj = await Language.findById(req.params.id).exec();
        if (!LanguageExistsObj) {
            throw new Error("Language not found , you might have already deleted it please reload the page once.");
        }
        await Language.findByIdAndUpdate(req.params.id, { name: req.body.name, isActive: req.body.isActive }).exec();

        res.status(200).json({ message: `Language Updated`, success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};


export const deleteLanguage = async (req, res, next) => {
    try {
        let LanguageExistsObj = await Language.findById(req.params.id).exec();
        if (!LanguageExistsObj) {
            throw new Error("Language not found , you might have already deleted it please reload the page once.");
        }
        await Language.findByIdAndDelete(req.params.id).exec();

        res.status(200).json({ message: `Language Deleted`, success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};