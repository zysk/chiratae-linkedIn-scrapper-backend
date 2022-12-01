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
