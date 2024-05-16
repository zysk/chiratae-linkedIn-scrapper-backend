import LeadLogs from "../models/LeadLogs.model";

export const getLeadLogs = async (req, res, next) => {
    try {
        let LeadStatusArr = await LeadLogs.find({ leadId: req.params.id }).exec();
        res.status(200).json({ message: "Lead history found", data: LeadStatusArr, success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};
