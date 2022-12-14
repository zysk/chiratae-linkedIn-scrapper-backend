import Lead from "../models/leads.model";
import Language from "../models/language.model";

export const AddLead = async (req, res, next) => {
    try {
        let LeadObj = await Lead.findOne({ name: new RegExp(`^${req.body.name}$`) }).exec();
        // if (LeadObj) {
        //     throw new Error("You are already a Lead")
        // }


        let englishObj = await Language.findOne({ name: "English" }).exec()
        await new Lead(req.body).save();


        console.log(`${req.body.type}`.toLowerCase() == "newsletter", englishObj._id, req.body.languageId, `${req.body.languageId}` == `${englishObj._id}`, `${req.body.languageId}`, `${englishObj._id}`, "languageId")

        if (`${req.body.type}`.toLowerCase() == "newsletter") {
            if (`${req.body.languageId}` == `${englishObj._id}`) {
                res.status(200).json({ message: "Thank you for subscribing to our newsletter !", success: true });
                console.log("english")
            }
            else {
                console.log("german")
                res.status(200).json({ message: "Vielen Dank, dass Sie sich für unseren Newsletter angemeldet haben!", success: true });
            }
        }
        else {
            if (`${req.body.languageId}` == `${englishObj._id}`) {
                res.status(200).json({ message: "Thank you! We have received your request. Company will get back to you shortly.", success: true });
            }
            else {
                res.status(200).json({ message: "Vielen Dank! Wir haben deine Anfrage erhalten. Das Unternehmen wird sich in Kürze bei Dir melden.", success: true });
            }
        }
    } catch (error) {
        console.error(error);
        next(error);
    }
};


export const getLead = async (req, res, next) => {
    try {
        let LeadArr = await Lead.find().exec();
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

