import Visitor from './visitor.model.js';
import VisitorVisit from './visitorVisit.model.js';
import { VISITOR_STATUS, VISITOR_VISIT_STATUS } from './visitor.constant.js';

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
 * Fetches complete visitor details with necessary populations using lean queries
 * @param {String} visitorId 
 * @returns {Promise<Object>} Populated lean visitor object
 */
export const getVisitorDetails = async (visitorId) => {
    return await Visitor.findById(visitorId)
        .populate({
            path: 'students',
            select: 'name hostelId'
        })
        .populate({
            path: 'organizationId',
            select: 'name'
        })
        .populate({
            path: 'approvalTimeline.performedBy',
            select: 'name role'
        })
        .lean();
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

/**
 * Returns dashboard statistics based on role and resolved context filters.
 * @param {String} role 
 * @param {Object} context 
 * @returns {Promise<Object>}
 */
export const getDashboardStats = async (role, context) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const now = new Date();

    const stats = {};

    switch (role) {
        case 'super_admin': {
            const [total, pending, inside, todaysVisits] = await Promise.all([
                Visitor.countDocuments(),
                Visitor.countDocuments({ approvalStatus: VISITOR_STATUS.PENDING }),
                VisitorVisit.countDocuments({ status: VISITOR_VISIT_STATUS.CHECKED_IN }),
                VisitorVisit.countDocuments({ checkInTime: { $gte: today, $lte: endOfToday } })
            ]);
            stats.totalVisitors = total;
            stats.pendingApproval = pending;
            stats.visitorsInside = inside;
            stats.todaysVisits = todaysVisits;
            break;
        }
        case 'admin': {
            const orgFilter = { organizationId: context.organizationId };
            const [pending, approved, inside, todaysVisits] = await Promise.all([
                Visitor.countDocuments({ ...orgFilter, approvalStatus: VISITOR_STATUS.PENDING }),
                Visitor.countDocuments({ ...orgFilter, approvalStatus: VISITOR_STATUS.APPROVED }),
                VisitorVisit.countDocuments({ ...orgFilter, status: VISITOR_VISIT_STATUS.CHECKED_IN }),
                VisitorVisit.countDocuments({ ...orgFilter, checkInTime: { $gte: today, $lte: endOfToday } })
            ]);
            stats.pendingApproval = pending;
            stats.approvedVisitors = approved;
            stats.visitorsInside = inside;
            stats.todaysVisits = todaysVisits;
            break;
        }
        case 'warden': {
            const hostelFilter = { hostelId: context.hostelId };
            const [inside, todaysCheckIns, todaysCheckOuts, overstayed] = await Promise.all([
                VisitorVisit.countDocuments({ ...hostelFilter, status: VISITOR_VISIT_STATUS.CHECKED_IN }),
                VisitorVisit.countDocuments({ ...hostelFilter, checkInTime: { $gte: today, $lte: endOfToday } }),
                VisitorVisit.countDocuments({ ...hostelFilter, checkOutTime: { $gte: today, $lte: endOfToday } }),
                VisitorVisit.countDocuments({ ...hostelFilter, status: VISITOR_VISIT_STATUS.CHECKED_IN, expectedExitTime: { $lt: now } })
            ]);
            stats.visitorsInside = inside;
            stats.todaysCheckIns = todaysCheckIns;
            stats.todaysCheckOuts = todaysCheckOuts;
            stats.overstayedVisitors = overstayed;
            break;
        }
        case 'parent': {
            const studentFilter = { students: { $in: context.studentIds } };
            const [myVisitors, pending, approved, rejected] = await Promise.all([
                Visitor.countDocuments(studentFilter),
                Visitor.countDocuments({ ...studentFilter, approvalStatus: VISITOR_STATUS.PENDING }),
                Visitor.countDocuments({ ...studentFilter, approvalStatus: VISITOR_STATUS.APPROVED }),
                Visitor.countDocuments({ ...studentFilter, approvalStatus: VISITOR_STATUS.REJECTED })
            ]);
            stats.myVisitors = myVisitors;
            stats.pendingApproval = pending;
            stats.approvedVisitors = approved;
            stats.rejectedVisitors = rejected;
            break;
        }
        case 'student': {
            const studentFilter = { students: context.studentId };
            const visitFilter = { visitorId: { $in: context.visitorIds } }; // visitorIds of visitors assigned to this student
            const [approved, pending, todaysVisits, total] = await Promise.all([
                Visitor.countDocuments({ ...studentFilter, approvalStatus: VISITOR_STATUS.APPROVED }),
                Visitor.countDocuments({ ...studentFilter, approvalStatus: VISITOR_STATUS.PENDING }),
                VisitorVisit.countDocuments({ ...visitFilter, checkInTime: { $gte: today, $lte: endOfToday } }),
                Visitor.countDocuments(studentFilter)
            ]);
            stats.myApprovedVisitors = approved;
            stats.pendingVisitors = pending;
            stats.todaysVisits = todaysVisits;
            stats.totalVisitors = total;
            break;
        }
    }

    return stats;
};

/**
 * Finds an active visit for a specific visitor
 * @param {String} visitorId 
 * @returns {Promise<Object>}
 */
export const findActiveVisit = async (visitorId) => {
    return await VisitorVisit.findOne({
        visitorId,
        status: VISITOR_VISIT_STATUS.CHECKED_IN
    });
};

/**
 * Creates a new visit record
 * @param {Object} visitData 
 * @returns {Promise<Object>}
 */
export const createVisit = async (visitData) => {
    const visit = new VisitorVisit(visitData);
    return await visit.save();
};

/**
 * Groups VisitorVisits by hostel for Super Admin
 * @param {Object} matchStage 
 * @param {Number} skip 
 * @param {Number} limit 
 * @param {Object} sortStage 
 */
export const getSuperAdminHostelVisitSummary = async (matchStage, skip, limit, sortStage) => {
    const pipeline = [
        { $match: matchStage },
        {
            $group: {
                _id: "$hostelId",
                totalVisits: { $sum: 1 },
                inside: {
                    $sum: {
                        $cond: [{ $eq: ["$status", VISITOR_VISIT_STATUS.CHECKED_IN] }, 1, 0]
                    }
                },
                completed: {
                    $sum: {
                        $cond: [{ $eq: ["$status", VISITOR_VISIT_STATUS.COMPLETED] }, 1, 0]
                    }
                }
            }
        },
        {
            $lookup: {
                from: 'hostels',
                localField: '_id',
                foreignField: '_id',
                as: 'hostelInfo'
            }
        },
        { $unwind: { path: '$hostelInfo', preserveNullAndEmptyArrays: true } },
        {
            $lookup: {
                from: 'users',
                localField: 'hostelInfo.wardens',
                foreignField: '_id',
                as: 'wardenDocs'
            }
        },
        {
            $project: {
                _id: 0,
                hostelId: '$_id',
                hostelName: '$hostelInfo.name',
                totalVisits: 1,
                inside: 1,
                completed: 1,
                wardenName: {
                    $reduce: {
                        input: "$wardenDocs.name",
                        initialValue: "",
                        in: {
                            $cond: {
                                if: { $eq: ["$$value", ""] },
                                then: "$$this",
                                else: { $concat: ["$$value", ", ", "$$this"] }
                            }
                        }
                    }
                }
            }
        },
        // In case hostel search is applied via matchStage on hostelName, we need to sort after project.
        // Actually matchStage runs before lookup, so search on hostelName won't work in matchStage!
        // We'll move search to a separate match after lookup in the service layer if needed, or do it here.
        // Wait, the specification said "search hostel". We'll do it post-lookup if needed.
    ];

    // If there is a search filter for hostelName, it should be passed separately or injected after lookup
    // For simplicity, we can inject a match on hostelName if provided in sortStage/matchStage.
    // The service layer will just pass the pipeline stages if we want to be flexible.

    // Instead of raw pipeline, let's allow the service to pass the full pipeline or we build it here.
    return []; // We will rewrite this method to be cleaner below.
};

// Rewritten optimized version:
export const getSuperAdminHostelVisitSummaryAggregated = async (matchStage, searchMatchStage, skip, limit, sortStage) => {
    const pipeline = [
        { $match: matchStage }, // usually empty or organization-wide if we support it, but for SuperAdmin it's {}
        {
            $group: {
                _id: "$hostelId",
                totalVisits: { $sum: 1 },
                inside: {
                    $sum: {
                        $cond: [{ $eq: ["$status", VISITOR_VISIT_STATUS.CHECKED_IN] }, 1, 0]
                    }
                },
                completed: {
                    $sum: {
                        $cond: [{ $eq: ["$status", VISITOR_VISIT_STATUS.COMPLETED] }, 1, 0]
                    }
                }
            }
        },
        {
            $lookup: {
                from: 'hostels',
                localField: '_id',
                foreignField: '_id',
                as: 'hostelInfo'
            }
        },
        { $unwind: { path: '$hostelInfo', preserveNullAndEmptyArrays: true } },
        {
            $lookup: {
                from: 'users',
                localField: 'hostelInfo.wardens',
                foreignField: '_id',
                as: 'wardenDocs'
            }
        },
        {
            $project: {
                _id: 0,
                hostelId: '$_id',
                hostelName: { $ifNull: ['$hostelInfo.name', 'Unknown'] },
                totalVisits: 1,
                inside: 1,
                completed: 1,
                wardenName: {
                    $cond: {
                        if: { $gt: [{ $size: "$wardenDocs" }, 0] },
                        then: {
                            $reduce: {
                                input: "$wardenDocs.name",
                                initialValue: "",
                                in: {
                                    $cond: {
                                        if: { $eq: ["$$value", ""] },
                                        then: "$$this",
                                        else: { $concat: ["$$value", ", ", "$$this"] }
                                    }
                                }
                            }
                        },
                        else: "Unassigned"
                    }
                }
            }
        }
    ];

    if (Object.keys(searchMatchStage).length > 0) {
        pipeline.push({ $match: searchMatchStage });
    }

    pipeline.push({ $sort: sortStage });

    pipeline.push({
        $facet: {
            metadata: [{ $count: 'total' }],
            data: [{ $skip: skip }, { $limit: limit }]
        }
    });

    const result = await VisitorVisit.aggregate(pipeline);

    const data = result[0].data;
    const total = result[0].metadata[0] ? result[0].metadata[0].total : 0;

    return { data, total };
};


/**
 * Fetches visitor visits with role-based filtering, pagination, and projection for tables.
 * @param {Object} matchStage 
 * @param {Object} searchMatchStage 
 * @param {Object} sortStage 
 * @param {Number} skip 
 * @param {Number} limit 
 * @returns {Promise<Object>} { data: Array, total: Number }
 */
export const getVisitorVisits = async (matchStage, searchMatchStage, sortStage, skip, limit) => {
    const pipeline = [
        { $match: matchStage },
        // Lookup Visitor
        {
            $lookup: {
                from: 'visitors',
                localField: 'visitorId',
                foreignField: '_id',
                as: 'visitorInfo'
            }
        },
        { $unwind: { path: '$visitorInfo', preserveNullAndEmptyArrays: true } },
        // Lookup Students
        {
            $lookup: {
                from: 'students',
                localField: 'students',
                foreignField: '_id',
                as: 'studentDocs'
            }
        },
        // Lookup Hostel
        {
            $lookup: {
                from: 'hostels',
                localField: 'hostelId',
                foreignField: '_id',
                as: 'hostelInfo'
            }
        },
        { $unwind: { path: '$hostelInfo', preserveNullAndEmptyArrays: true } },
        // Add Room Number logic based on the first student
        {
            $lookup: {
                from: 'rooms',
                localField: 'studentDocs.roomId', // array of room IDs
                foreignField: '_id',
                as: 'roomDocs'
            }
        },
        // Calculate fields and project
        {
            $project: {
                _id: 0,
                visitId: '$_id',
                visitorName: '$visitorInfo.name',
                visitorPhone: '$visitorInfo.phone', // included temporarily for search, removed later if needed
                studentNames: {
                    $reduce: {
                        input: "$studentDocs.name",
                        initialValue: "",
                        in: {
                            $cond: {
                                if: { $eq: ["$$value", ""] },
                                then: "$$this",
                                else: { $concat: ["$$value", ", ", "$$this"] }
                            }
                        }
                    }
                },
                roomNumber: {
                    $cond: {
                        if: { $gt: [{ $size: "$roomDocs" }, 0] },
                        then: { $arrayElemAt: ["$roomDocs.roomNumber", 0] },
                        else: "N/A"
                    }
                },
                checkInTime: 1,
                checkOutTime: 1,
                status: 1,
                hostelName: '$hostelInfo.name'
            }
        }
    ];

    if (Object.keys(searchMatchStage).length > 0) {
        pipeline.push({ $match: searchMatchStage });
    }

    pipeline.push({ $sort: sortStage });

    pipeline.push({
        $facet: {
            metadata: [{ $count: 'total' }],
            data: [
                { $skip: skip },
                { $limit: limit },
                { $project: { visitorPhone: 0 } } // Remove phone from final output as per requirements
            ]
        }
    });

    const result = await VisitorVisit.aggregate(pipeline);

    const data = result[0].data;
    const total = result[0].metadata[0] ? result[0].metadata[0].total : 0;

    return { data, total };
};

/**
 * Fetches complete details of a single visit using lean populate
 * @param {String} visitId 
 * @returns {Promise<Object>}
 */
export const getVisitDetailsById = async (visitId) => {
    return await VisitorVisit.findById(visitId)
        .populate({
            path: 'visitorId',
            select: 'name phone relationship address idProofType idProofNumber'
        })
        .populate({
            path: 'students',
            select: 'name studentId roomId department course',
        })
        .populate({
            path: 'hostelId',
            select: 'name'
        })
        .populate({
            path: 'organizationId',
            select: 'name'
        })
        .populate({
            path: 'checkedInBy',
            select: 'name role'
        })
        .populate({
            path: 'checkedOutBy',
            select: 'name role'
        })
        .populate({
            path: 'visitTimeline.performedBy',
            select: 'name role'
        })
        .lean();
};
