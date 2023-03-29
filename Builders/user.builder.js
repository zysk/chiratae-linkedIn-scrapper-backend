import mongoose from "mongoose";

export const UserList = (payload) => {
    console.log(payload);
    let pipeline = [],
        matchCondition = {},
        sortCondition = {};

    if (payload.role != "") {
        matchCondition.role = { $regex: new RegExp(`\\s+${payload.role.trim()}|${payload.role.trim()}`), $options: "-i" };
    }

    sortCondition = { createdAt: -1 };

    pipeline.push(
        { $match: matchCondition },
        {
            $project: {
                _id: 1,
                name: 1,
                email: 1,
                phone: 1,
                role: 1,
                firstName: 1,
                lastName: 1,
                shopName: 1,
                dob: 1,
                country: 1,
                stateName: 1,
                pincode: 1,
                language: 1,
                isActive: 1,

                visitingCard: 1,
                shopImage: 1,
                onlinePortal: 1,
                kycStatus: 1,
                createdAt: 1,
            },
        },
        { $sort: sortCondition }
    );

    return pipeline;
};
export const UserListWithCampaigns = (payload) => {
    console.log(payload);
    let pipeline = []



    pipeline.push(
        {
            '$match': {
                'role': 'CLIENT',
                "_id": mongoose.Types.ObjectId(payload),
            }
        },
        {
            '$lookup': {
                'from': 'leads',
                'localField': '_id',
                'foreignField': 'clientId',
                'as': 'campaignsArr'
            }
        },
        {
            '$unwind': {
                'path': '$campaignsArr',
                'preserveNullAndEmptyArrays': true
            }
        },
        {
            '$lookup': {
                'from': 'campaigns',
                'localField': 'campaignsArr.campaignId',
                'foreignField': '_id',
                'as': 'campaignObj'
            }
        },
        {
            '$unwind': {
                'path': '$campaignObj',
                'preserveNullAndEmptyArrays': true
            }
        },
        {
            '$group': {
                '_id': '$_id',
                'originalObject': {
                    '$first': '$$ROOT'
                },
                'campaignsArr': {
                    '$push': '$campaignObj'
                }
            }
        },
        {
            '$addFields': {
                'originalObject.campaignsArr': '$campaignsArr'
            }
        },
        {
            '$replaceRoot': {
                'newRoot': '$originalObject'
            }
        },
        {
            '$project': {
                '_id': 1,
                'name': 1,
                'searchCompleted': 1,
                'link': 1,
                'educationArr': 1,
                'exprienceArr': 1,
                'contactInfoArr': 1,
                'location': 1,
                'currentPosition': 1,
                'campaignsArr': {
                    'name': 1,
                    'createdAt': 1,
                    'updatedAt': 1,
                    'school': 1,
                    'company': 1,
                    'searchQuery': 1,
                    '_id': 1
                },
                'createdAt': 1,
                'updatedAt': 1
            }
        },
    );

    return pipeline;
};





export const leadsList = (payload) => {
    console.log(payload);
    let pipeline = [];
    let matchCondition = [
        {
            $sort: {
                'createdAt': -1,
            },
        },
        {
            '$lookup': {
                'from': 'campaigns',
                'localField': 'campaignId',
                'foreignField': '_id',
                'as': 'campaignObj'
            }
        },
        {
            '$unwind': {
                'path': '$campaignObj',
                'preserveNullAndEmptyArrays': true
            }
        },
        {
            '$lookup': {
                'from': 'users',
                'localField': 'clientId',
                'foreignField': '_id',
                'as': 'clientObj'
            }
        },
        {
            '$unwind': {
                'path': '$clientObj',
                'preserveNullAndEmptyArrays': true
            }
        }
    ]


    let sortCondition = {};


    if (payload.leadAssignedToId) {
        matchCondition.push({
            '$match': {
                'leadAssignedToId': mongoose.Types.ObjectId(payload.leadAssignedToId)
            }
        })
        matchCondition.push({
            '$lookup': {
                'from': 'users',
                'localField': 'leadAssignedToId',
                'foreignField': '_id',
                'as': 'leadAssignedToObj'
            }
        })
        matchCondition.push({
            '$unwind': {
                'path': '$leadAssignedToObj',
                'preserveNullAndEmptyArrays': false
            }
        })
    }
    else {
        matchCondition.push({
            '$lookup': {
                'from': 'users',
                'localField': 'leadAssignedToId',
                'foreignField': '_id',
                'as': 'leadAssignedToObj'
            }
        })
        matchCondition.push({
            '$unwind': {
                'path': '$leadAssignedToObj',
                'preserveNullAndEmptyArrays': true
            }
        })
    }

    if (payload.filter == "assigned") {
        matchCondition.push({
            '$match': {
                "leadAssignedToId": {
                    $exists: true,
                }
            }
        })
    }
    else if (payload.filter == "un-assigned") {
        matchCondition.push({
            '$match': {
                "leadAssignedToId": {
                    $exists: false,
                }
            }
        })
    }

    if (payload.school && payload.school != "") {
        let schoolArr = payload.school.split(",");
        console.log(schoolArr, "schoolArr")
        matchCondition.push({
            '$match': {
                '$or': [{
                    'clientObj.educationArr.schoolName': {
                        '$regex': `${schoolArr[0].trim()}`,
                        '$options': 'i'
                    }
                },
                {
                    'clientObj.educationArr.schoolDetail': {
                        '$regex': `${schoolArr[0].trim()}`,
                        '$options': 'i'
                    }
                },
                {
                    'clientObj.educationArr.schoolName': {
                        '$regex': `${schoolArr && schoolArr.length > 0 ? schoolArr[1].trim() : ""}`,
                        '$options': 'i'
                    }
                },
                {
                    'clientObj.educationArr.schoolDetail': {
                        '$regex': `${schoolArr && schoolArr.length > 0 ? schoolArr[1].trim() : ""}`,
                        '$options': 'i'
                    }
                },
                ]
            }
        })
    }
    if (payload.company && payload.company != "") {
        matchCondition.push({
            '$match': {
                '$or': [{
                    'clientObj.experienceArr.company': {
                        '$regex': `${payload.company}`,
                        '$options': 'i'
                    }
                },
                {
                    'clientObj.experienceArr.companyDetail': {
                        '$regex': `${payload.company}`,
                        '$options': 'i'
                    }
                },
                ]
            }
        })
    }


    if (payload.searchQueryValue && payload.searchQueryValue != "") {
        matchCondition.push({
            '$match': {
                '$or': [
                    {
                        'clientObj.name': {
                            '$regex': `${payload.searchQueryValue}`,
                            '$options': 'i'
                        }
                    },
                    {
                        'clientObj.educationArr.schoolName': {
                            '$regex': `${payload.searchQueryValue}`,
                            '$options': 'i'
                        }
                    },
                    {
                        'clientObj.educationArr.schoolDetail': {
                            '$regex': `${payload.searchQueryValue}`,
                            '$options': 'i'
                        }
                    },
                    {
                        'clientObj.experienceArr.company': {
                            '$regex': `${payload.searchQueryValue}`,
                            '$options': 'i'
                        }
                    },
                    {
                        'clientObj.experienceArr.companyDetail': {
                            '$regex': `${payload.searchQueryValue}`,
                            '$options': 'i'
                        }
                    }
                ]
            }
        })
    }





    pipeline.push(
        ...matchCondition,
        { $addFields: { checked: false } },
        {
            '$skip': payload.skip
        },
        {
            '$limit': payload.limit
        },
        // { $sort: sortCondition }
    );

    return pipeline;
};





export const leadsDetails = (payload) => {
    console.log(payload);
    let pipeline = [];
    let matchCondition = [
        {
            $match: {

                $or: [{ "_id": mongoose.Types.ObjectId(payload.id), }, { "clientId": mongoose.Types.ObjectId(payload.id) }]
            },
        },
        {
            '$lookup': {
                'from': 'campaigns',
                'localField': 'campaignId',
                'foreignField': '_id',
                'as': 'campaignObj'
            }
        },
        {
            '$unwind': {
                'path': '$campaignObj',
                'preserveNullAndEmptyArrays': true
            }
        },
        {
            '$lookup': {
                'from': 'users',
                'localField': 'clientId',
                'foreignField': '_id',
                'as': 'clientObj'
            }
        },
        {
            '$unwind': {
                'path': '$clientObj',
                'preserveNullAndEmptyArrays': true
            }
        },
        {
            $lookup:
            /**
             * from: The target collection.
             * localField: The local join field.
             * foreignField: The target join field.
             * as: The name for the results.
             * pipeline: Optional pipeline to run on the foreign collection.
             * let: Optional variables to use in the pipeline field stages.
             */
            {
                from: "previousleads",
                let: {
                    name: "$clientObj.name",
                    searchQuery: "$campaignObj.searchQuery",
                    url: "$clientObj.url",
                },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    {
                                        $eq: ["$name", "$$name"]
                                    },
                                    {
                                        $eq: ["$url", "$$url"]
                                    },
                                    {
                                        $eq: [
                                            "$searchQuery",
                                            "$$searchQuery",
                                        ],
                                    },
                                ],
                            },
                        },
                    },
                ],
                as: "previousLeadsArr",
            },
        },
    ]


    let sortCondition = {};


    if (payload.leadAssignedToId) {
        matchCondition.push({
            '$match': {
                'leadAssignedToId': mongoose.Types.ObjectId(payload.leadAssignedToId)
            }
        })
        matchCondition.push({
            '$lookup': {
                'from': 'users',
                'localField': 'leadAssignedToId',
                'foreignField': '_id',
                'as': 'leadAssignedToObj'
            }
        })
        matchCondition.push({
            '$unwind': {
                'path': '$leadAssignedToObj',
                'preserveNullAndEmptyArrays': false
            }
        })
    }
    else {
        matchCondition.push({
            '$lookup': {
                'from': 'users',
                'localField': 'leadAssignedToId',
                'foreignField': '_id',
                'as': 'leadAssignedToObj'
            }
        })
        matchCondition.push({
            '$unwind': {
                'path': '$leadAssignedToObj',
                'preserveNullAndEmptyArrays': true
            }
        })
    }





    pipeline.push(
        ...matchCondition,
        // { $sort: sortCondition }
    );

    return pipeline;
};












