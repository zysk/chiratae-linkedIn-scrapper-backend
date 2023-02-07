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
                "_id": mongoose.Types.ObjectId(payload.id)
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












