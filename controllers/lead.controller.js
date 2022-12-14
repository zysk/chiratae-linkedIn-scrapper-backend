import Lead from "../models/leads.model";
import Language from "../models/language.model";
import Product from "../models/product.model";
import ProductWithLanguage from "../models/productWithLanguage.model";

export const AddLead = async (req, res, next) => {
    try {
        let LeadObj = await Lead.findOne({ name: new RegExp(`^${req.body.name}$`) }).exec();

        let englishObj = await Language.findOne({ name: "English" }).exec()
        await new Lead(req.body).save();

        let message = "";

        if (`${req.body.type}`.toLowerCase() == "newsletter") {
            if (`${req.body.languageId}` == `${englishObj._id}`) {
                message = "Thank you for subscribing to our newsletter !"
            }
            else {
                message = "Vielen Dank, dass Sie sich für unseren Newsletter angemeldet haben!"
            }
        }
        else {
            if (`${req.body.languageId}` == `${englishObj._id}`) {
                message = "Thank you! We have received your request. Company will get back to you shortly."
            }
            else {
                message = "Vielen Dank! Wir haben deine Anfrage erhalten. Das Unternehmen wird sich in Kürze bei Dir melden."
            }
        }

        res.status(200).json({ message: message, success: true });

    } catch (error) {
        console.error(error);
        next(error);
    }
};


export const getLead = async (req, res, next) => {
    try {
        let LeadArr = await Lead.find().lean().exec();

        for (const el of LeadArr) {
            let productObj = {}
            if (el.productId) {
                let tempProductObj = await Product.findById(el.productId).exec()
                if (tempProductObj) {
                    productObj = { name: tempProductObj.name }
                }
                else {
                    let tempProductObj2 = await ProductWithLanguage.findById(el.productId).exec()
                    if (tempProductObj2) {
                        productObj = { name: tempProductObj2.name }
                    }
                }
            }
            el.productObj = productObj
        }
        res.status(200).json({ message: "Leads found", data: LeadArr, success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};
export const updateLead = async (req, res, next) => {
    try {
        console.log(req.body, "leadddddd")
        let LanguageExistsObj = await Lead.findById(req.params.id).exec();
        if (!LanguageExistsObj) {
            throw new Error("Lead not found , you might have already deleted it please reload the page once.");
        }
        await Lead.findByIdAndUpdate(req.params.id, { status: req.body.status }).exec();

        res.status(200).json({ message: `Lead Updated`, success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};

