
import { leadsComments } from "../Builders/LeadComment.builder";
import LeadComments from "../models/LeadComments.model";


export const AddLeadComments = async (req, res, next) => {
    try {
        await new LeadComments({ ...req.body, createdBy: req.user.userId }).save()
        res.status(200).json({ message: "Lead Comment saved", success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};
export const getLeadComments = async (req, res, next) => {
    try {
        let LeadCommentsArr = await LeadComments.aggregate([leadsComments(req.params.id)]).exec()
        res.status(200).json({ message: "Lead Comments found", data: LeadCommentsArr, success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};

