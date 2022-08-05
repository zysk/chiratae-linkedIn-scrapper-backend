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
            },
        },
        { $sort: sortCondition }
    );

    return pipeline;
};
