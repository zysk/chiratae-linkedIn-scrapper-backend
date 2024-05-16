import LeadStatus from "../models/LeadStatus.model";

export const createNewLeadStatus = async (req, res, next) => {
    try {
        let existsCheck = await LeadStatus.findOne({ value: req.body.value }).exec();
        if (existsCheck) {
            throw new Error("LeadStatus Already Exists!");
        }
        let newLeadStatus = await new LeadStatus(req.body).save();
        res.status(200).json({ message: "User Created", success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};

export const getLeadStatus = async (req, res, next) => {
    try {
        let LeadStatusArr = await LeadStatus.find().exec();
        res.status(200).json({ message: "LeadStatus found", data: LeadStatusArr, success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};

export const deleteLeadStatus = async (req, res, next) => {
    try {
        let LeadStatusObj = await LeadStatus.findByIdAndDelete(req.params.id).exec();
        if (!LeadStatusObj) throw { status: 400, message: "LeadStatus not found or deleted already" };
        res.status(200).json({ message: "LeadStatus deleted successfully", success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};
