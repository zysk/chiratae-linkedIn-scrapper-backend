
import { leadsList } from "../Builders/user.builder";
import Lead from "../models/leads.model";

export const createNewLead = async (req, res, next) => {
    try {
        let existsCheck = await Lead.findOne({ value: req.body.value }).exec()
        if (existsCheck) {
            throw new Error("Lead Already Exists!");
        }
        let newLeadStatus = await new Lead(req.body).save();
        res.status(200).json({ message: "User Created", success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};


export const getLeads = async (req, res, next) => {
    try {
        let query = {}
        if (req.query.role == "USER") {
            if (req.query.userId) {
                query = { ...query, leadAssignedToId: `${req.query.userId}` }
            }
        }

        let aggregation = [
            {
                '$lookup': {
                    'from': 'campaigns',
                    'localField': 'campaignId',
                    'foreignField': '_id',
                    'as': 'campaignObj'
                }
            }, {
                '$unwind': {
                    'path': '$campaignObj',
                    'includeArrayIndex': 'string',
                    'preserveNullAndEmptyArrays': true
                }
            }, {
                '$lookup': {
                    'from': 'users',
                    'localField': 'clientId',
                    'foreignField': '_id',
                    'as': 'clientObj'
                }
            }, {
                '$unwind': {
                    'path': '$clientObj',
                    'includeArrayIndex': 'string',
                    'preserveNullAndEmptyArrays': false
                }
            }
        ]



        let LeadStatusArr = await Lead.aggregate([leadsList(query)]).exec()
        res.status(200).json({ message: "Lead found", data: LeadStatusArr, success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};



export const assignLeadToUser = async (req, res, next) => {
    try {
        let LeadObj = await Lead.findById(req.params.id).exec()
        if (!LeadObj) {
            throw new Error("Lead not found !");
        }

        let updatedLead = await Lead.findByIdAndUpdate(req.params.id, { leadAssignedToId: req.body.userId }).exec()


        res.status(200).json({ message: "Lead Assigned", success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};

export const deleteLead = async (req, res, next) => {
    try {
        let LeadStatusObj = await Lead.findByIdAndDelete(req.params.id).exec();
        if (!LeadStatusObj) throw { status: 400, message: "Lead not found or deleted already" };
        res.status(200).json({ message: "Lead deleted successfully", success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};

