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
            },
        },
        { $sort: sortCondition }
    );

    return pipeline;
};
