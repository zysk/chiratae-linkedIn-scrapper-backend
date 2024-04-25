
import { leadsDetails, leadsList } from "../Builders/user.builder";
import Lead from "../models/leads.model";
import User from "../models/user.model";
import LeadLogs from "../models/LeadLogs.model";

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
        console.log(req.query, "skip")
        if (req.query.skip) {
            query = { ...query, skip: parseInt(req.query.skip) }
        }
        if (req.query.limit) {
            query = { ...query, limit: parseInt(req.query.limit) }
        }
        if (req.query.filter) {
            query = { ...query, filter: req.query.filter }
        }
        if (req.query.searchQueryValue) {
            query = { ...query, searchQueryValue: req.query.searchQueryValue }
        }
        if (req.query.school) {
            query = { ...query, school: req.query.school }
        }
        if (req.query.company) {
            query = { ...query, company: req.query.company }
        }
        console.log(leadsList(query), "leadsList(query)")
        let LeadStatusArr = await Lead.aggregate([leadsList(query)]).exec()
        let totalLeads = 0
        if (req.query.userId) {
            totalLeads = await Lead.find({ leadAssignedToId: `${req.query.userId}` }).count()
        } else {
            if (req.query.filter == "assigned") {
                console.log("assigned")
                totalLeads = await Lead.find({ leadAssignedToId: { $exists: true } }).count()
            }
            else if (req.query.filter == "un-assigned") {
                console.log("un-assigned")
                totalLeads = await Lead.find({ leadAssignedToId: { $exists: false } }).count()
            }
            else if (req.query.searchQueryValue && req.query.searchQueryValue != "") {
                console.log("req.query.searchQueryValue")
                totalLeads = LeadStatusArr.length

                console.log(totalLeads, "!!!!!!!!!!!!!!!!!!!!!!@@@@@@@@@@@@@@@@@@@@@@@@@@@######################EE$$$$$$$$$$$")
            }
            else {
                console.log("else")
                totalLeads = await Lead.find().count()
            }
        }
        console.log(totalLeads, "totalLeads")
        console.log(LeadStatusArr.length, "LeadStatusArr")
        res.status(200).json({ message: "Lead found", data: LeadStatusArr, totalLeads: totalLeads, success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};
export const getLeadById = async (req, res, next) => {
    try {
        let query = {}
        query = { ...query, id: req.params.id }
        if (req.query.role == "USER") {
            if (req.query.userId) {
                query = { ...query, leadAssignedToId: `${req.query.userId}` }
            }
        }

        let LeadStatusArr = await Lead.aggregate([leadsDetails(query)]).exec()

        res.status(200).json({ message: "Lead found", data: LeadStatusArr[0], success: true });
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
        let userObj = await User.findById(req.body.userId).exec()
        if (!userObj) {
            throw new Error("Sub User not found !");
        }
        await new LeadLogs({
            leadId: LeadObj._id,
            value: `${userObj?.name}`,
            previousValue: `N.A.`,
            message: `Lead assigned to ${userObj?.name}`
        }).save()


        let updatedLead = await Lead.findByIdAndUpdate(req.params.id, { leadAssignedToId: req.body.userId }).exec()


        res.status(200).json({ message: "Lead Assigned", success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};
export const automaticallyAssignLeadsToUser = async (req, res, next) => {
    try {

        let totalUsersArr = await User.find({ isActive: true }).find();

        if ((totalUsersArr && totalUsersArr.length == 0) || !totalUsersArr) {
            throw new Error("No active sub users found to allot leads to .")
        }

        let toatalLeadsArr = await Lead.find({ leadAssignedToId: { $exists: false } }).lean().exec();

        if ((toatalLeadsArr && toatalLeadsArr.length == 0) || !toatalLeadsArr) {
            throw new Error("No leads left to allot.")
        }
        let finalLeadsPool = toatalLeadsArr

        console.time();

        while (finalLeadsPool && finalLeadsPool.length > 0) {
            for (let i = 0; i <= totalUsersArr.length - 1; i++) {
                if (finalLeadsPool && finalLeadsPool.length == 0) {
                    break
                }

                await new LeadLogs({
                    leadId: finalLeadsPool[0]._id,
                    value: `${totalUsersArr[i]?._id}`,
                    previousValue: `N.A.`,
                    message: `Lead assigned to ${totalUsersArr[i]?.name}`
                }).save()
                let updatedLead = await Lead.findByIdAndUpdate(finalLeadsPool[0]._id, { leadAssignedToId: totalUsersArr[i]?._id }).exec()
                finalLeadsPool = finalLeadsPool.filter((elx, index) => index != 0);
            }
        }

        console.timeEnd();

        res.status(200).json({ message: "Leads Assigned automatically to all active sub users", success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};



export const automaticallyAssignLeadsToSelectedUsers = async (req, res, next) => {
    try {

        let totalUsersArr = req.body.usersArr;

        if ((totalUsersArr && totalUsersArr.length == 0) || !totalUsersArr) {
            throw new Error("No active sub users found to allot leads to .")
        }

        let toatalLeadsArr = await Lead.find({ leadAssignedToId: { $exists: false } }).lean().exec();

        if ((toatalLeadsArr && toatalLeadsArr.length == 0) || !toatalLeadsArr) {
            throw new Error("No leads left to allot.")
        }
        let finalLeadsPool = toatalLeadsArr

        console.time();

        while (finalLeadsPool && finalLeadsPool.length > 0) {
            for (let i = 0; i <= totalUsersArr.length - 1; i++) {
                if (finalLeadsPool && finalLeadsPool.length == 0) {
                    break
                }

                await new LeadLogs({
                    leadId: finalLeadsPool[0]._id,
                    value: `${totalUsersArr[i]?._id}`,
                    previousValue: `N.A.`,
                    message: `Lead assigned to ${totalUsersArr[i]?.name}`
                }).save()
                let updatedLead = await Lead.findByIdAndUpdate(finalLeadsPool[0]._id, { leadAssignedToId: totalUsersArr[i]?._id }).exec()
                finalLeadsPool = finalLeadsPool.filter((elx, index) => index != 0);
            }
        }

        console.timeEnd();

        res.status(200).json({ message: "Leads Assigned automatically to all active sub users", success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};


export const changeLeadStatus = async (req, res, next) => {
    try {
        let LeadObj = await Lead.findById(req.params.id).exec()
        if (!LeadObj) {
            throw new Error("Lead not found !");
        }
        console.log(req?.user?.user, req?.user?.user?.name, req?.user)
        await new LeadLogs({
            leadId: LeadObj._id,
            value: `${req.body.status}`,
            previousValue: `${LeadObj?.status}`,
            message: `Lead status changed to ${req.body.status} from ${LeadObj?.status} by ${req?.user?.userObj?.role == "ADMIN" ? "ADMIN" : req?.user?.user?.name}`,
        }).save()



        let updatedLead = await Lead.findByIdAndUpdate(req.params.id, { status: req.body.status }).exec()


        res.status(200).json({ message: "Lead Status Updated", success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};

export const changeLeadRating = async (req, res, next) => {
    try {
        let LeadObj = await Lead.findById(req.params.id).exec()
        if (!LeadObj) {
            throw new Error("Lead not found !");
        }

        await new LeadLogs({
            leadId: LeadObj._id,
            value: `${req.body.rating}`,
            previousValue: `${LeadObj?.rating}`,
            message: `Lead rating changed to ${req.body.rating} from ${LeadObj?.rating} by ${req?.user?.userObj?.role == "ADMIN" ? "ADMIN" : req?.user?.user?.name}`,
        }).save()

        let updatedLead = await Lead.findByIdAndUpdate(req.params.id, { rating: req.body.rating }).exec()


        res.status(200).json({ message: "Lead Rating Updated", success: true });
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
