import mongoose from "mongoose";

export const leadsComments = (payload) => {
    let pipeline = [];
    let matchCondition = [
        {
            $match: {
                leadId: mongoose.Types.ObjectId(`${payload}`),
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "createdBy",
                foreignField: "_id",
                as: "userObj",
            },
        },
        {
            $unwind: {
                path: "$userObj",
                preserveNullAndEmptyArrays: true,
            },
        },
    ];

    let sortCondition = {};

    sortCondition = { createdAt: 1 };

    pipeline.push(...matchCondition, { $sort: sortCondition });

    return pipeline;
};
