import Visitor from './visitor.model.js';

/**
 * Checks if a visitor with the same phone exists in the organization
 * @param {String} organizationId 
 * @param {String} phone 
 * @returns {Promise<Object>} The visitor if found, else null
 */
export const findDuplicateVisitor = async (organizationId, phone) => {
    return await Visitor.findOne({ organizationId, phone });
};

/**
 * Creates a new visitor profile
 * @param {Object} data 
 * @returns {Promise<Object>}
 */
export const createVisitor = async (data) => {
    const visitor = new Visitor(data);
    return await visitor.save();
};

/**
 * Fetches visitors with role-based filtering, pagination, and projection for tables.
 * @param {Object} matchStage 
 * @param {Object} sortStage 
 * @param {Number} skip 
 * @param {Number} limit 
 * @returns {Promise<Object>} { data: Array, total: Number }
 */
export const getVisitors = async (matchStage, sortStage, skip, limit) => {
    const pipeline = [
        { $match: matchStage },
        // Lookup Organization
        {
            $lookup: {
                from: 'organizations',
                localField: 'organizationId',
                foreignField: '_id',
                as: 'organizationInfo'
            }
        },
        { $unwind: { path: '$organizationInfo', preserveNullAndEmptyArrays: true } },
        // Lookup Students to get names and hostel info
        {
            $lookup: {
                from: 'students',
                localField: 'students',
                foreignField: '_id',
                as: 'studentDocs'
            }
        },
        // We can get the hostelId from the first student since they are validated to belong to the same hostel
        {
            $addFields: {
                firstStudentHostelId: { $arrayElemAt: ['$studentDocs.hostelId', 0] }
            }
        },
        // Lookup Hostel
        {
            $lookup: {
                from: 'hostels',
                localField: 'firstStudentHostelId',
                foreignField: '_id',
                as: 'hostelInfo'
            }
        },
        { $unwind: { path: '$hostelInfo', preserveNullAndEmptyArrays: true } },
        // Calculate fields and project
        {
            $addFields: {
                approvedTimelineEvent: {
                    $arrayElemAt: [
                        {
                            $filter: {
                                input: "$approvalTimeline",
                                as: "timeline",
                                cond: { $eq: ["$$timeline.action", "Approved"] }
                            }
                        },
                        0
                    ]
                }
            }
        },
        {
            $project: {
                _id: 0,
                visitorId: '$_id',
                visitorName: '$name',
                phone: 1,
                email: 1,
                relationship: 1,
                status: '$approvalStatus',
                createdAt: 1,
                approvedAt: '$approvedTimelineEvent.createdAt',
                organizationName: '$organizationInfo.name',
                hostelName: '$hostelInfo.name',
                students: {
                    $map: {
                        input: '$studentDocs',
                        as: 'st',
                        in: {
                            id: '$$st._id',
                            name: '$$st.name'
                        }
                    }
                }
            }
        },
        { $sort: sortStage },
        {
            $facet: {
                metadata: [{ $count: 'total' }],
                data: [{ $skip: skip }, { $limit: limit }]
            }
        }
    ];

    const result = await Visitor.aggregate(pipeline);
    
    const data = result[0].data;
    const total = result[0].metadata[0] ? result[0].metadata[0].total : 0;

    return { data, total };
};

/**
 * Finds a visitor by ID
 * @param {String} visitorId 
 * @returns {Promise<Object>}
 */
export const findVisitorById = async (visitorId) => {
    return await Visitor.findById(visitorId);
};

/**
 * Updates a visitor document and pushes to timeline
 * @param {String} visitorId 
 * @param {Object} updateData 
 * @param {Object} timelineEntry 
 * @returns {Promise<Object>}
 */
export const updateVisitorStatus = async (visitorId, updateData, timelineEntry) => {
    return await Visitor.findByIdAndUpdate(
        visitorId,
        {
            $set: updateData,
            $push: { approvalTimeline: timelineEntry }
        },
        { new: true }
    );
};
