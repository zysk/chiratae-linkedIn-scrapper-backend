import Lead from "../models/leads.model";

export const AddLead = async (req, res, next) => {
    try {
        let LeadObj = await Lead.findOne({ name: new RegExp(`^${req.body.name}$`) }).exec();
        // if (LeadObj) {
        //     throw new Error("You are already a Lead")
        // }
        await new Lead(req.body).save();
        res.status(200).json({ message: "Thank you! We have received your request. Company will get back to you shortly.", success: true });
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
        console.log(req.body,"leadddddd")
        let LanguageExistsObj = await Lead.findById(req.params.id).exec();
        if (!LanguageExistsObj) {
            throw new Error("Lead not found , you might have already deleted it please reload the page once.");
        }
        await Lead.findByIdAndUpdate(req.params.id, { status:req.body.status }).exec();

        res.status(200).json({ message: `Lead Updated`, success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};

