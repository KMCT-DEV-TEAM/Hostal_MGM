import mongoose from 'mongoose';
import Visitor from './visitor.model.js';
import VisitorVisit from './visitorVisit.model.js';
import VisitRequest from './visitRequest.model.js';
import { VISITOR_STATUS, VISITOR_VISIT_STATUS, VISITOR_VISIT_TIMELINE_ACTIONS } from './visitor.constant.js';
import Parent from '../parents/parent.model.js';
import User from '../users/user.model.js';

/**
 * Finds an existing Visitor matching ANY identity vector (Phone, Email, or ID Proof).
 * If any of these match an existing record, the system treats it as the same person.
 *
 * @param {String} phone
 * @param {String} email (optional)
 * @param {String} idProofType 
 * @param {String} idProofNumber 
 * @returns {Promise<Object|null>} The existing Visitor if found, else null
 */
export const findVisitorByIdentity = async (phone, email, idProofType, idProofNumber) => {
    const orConditions = [
        { phone },
        { idProofType, idProofNumber }
    ];
    if (email) {
        orConditions.push({ email });
    }
    return await Visitor.findOne({ $or: orConditions }).lean();
};

/**
 * Creates a new visitor profile inside a MongoDB session (for transaction safety).
 * @param {Object} data 
 * @param {import('mongoose').ClientSession} session 
 * @returns {Promise<Object>}
 */
export const createVisitorInSession = async (data, session) => {
    const [visitor] = await Visitor.create([data], { session });
    return visitor;
};

/**
 * Finds existing VisitRequests that block new requests for the same visitor and students.
 * Blocks on:
 *   - 'Pending'  → awaiting approval
 *   - 'Approved' → approved but not yet checked in at the gate
 *
 * @param {String} visitorId
 * @param {Array<String>} studentIds
 * @returns {Promise<Array>} Array of blocking requests (if any)
 */
export const findBlockingVisitRequests = async (visitorId, studentIds) => {
    return await VisitRequest.find({
        visitorId,
        studentId: { $in: studentIds },
        status: { $in: ['Pending', 'Approved'] }
    }).populate('studentId', 'name').lean();
};

/**
 * Finds active VisitorVisits (visitor currently inside the hostel)
 * for a given visitor and students.
 * Used to prevent creating a new request while the visitor is inside.
 *
 * @param {String} visitorId
 * @param {Array<String>} studentIds
 * @returns {Promise<Array>} Array of active visits
 */
export const findActiveVisitorVisits = async (visitorId, studentIds) => {
    return await VisitorVisit.find({
        'visitor.refId': visitorId,
        'students.studentId': { $in: studentIds },
        status: 'Checked In'
    }).lean();
};

/**
 * Creates a new VisitRequest, optionally inside a MongoDB session.
 *
 * @param {Object} data
 * @param {import('mongoose').ClientSession|null} session
 *   Pass the active session when creating inside a transaction.
 *   Pass null when creating outside a transaction (e.g. race-condition retry path).
 * @returns {Promise<Object>}
 */
export const createVisitRequest = async (data, session) => {
    if (session) {
        const [visitRequest] = await VisitRequest.create([data], { session });
        return visitRequest;
    }
    const visitRequest = new VisitRequest(data);
    return await visitRequest.save();
};

/**
 * Creates a new visitor profile (no session — legacy, used outside transactions)
 * @param {Object} data 
 * @returns {Promise<Object>}
 */
export const createVisitor = async (data) => {
    const visitor = new Visitor(data);
    return await visitor.save();
};
/**
 * Finds VisitRequests for a specific visitor and list of students
 * @param {String} visitorId 
 * @param {Array<String>} studentIds 
 */
export const getVisitRequestsByVisitorAndStudents = async (visitorId, studentIds) => {
    return await VisitRequest.find({
        visitorId,
        studentId: { $in: studentIds }
    }).lean();
};

/**
 * Unified aggregation for Visitor Listing (Staff, Student, Parent)
 * @param {Object} initialMatch - Filters on Visitor collection (status, dates)
 * @param {Object} studentMatch - Scope filters on populated Students (for Staff)
 * @param {Object} sortOptions - Searching and sorting
 * @param {Number} skip 
 * @param {Number} limit 
 * @param {String} parentIdMatch - (Optional) If provided, filters visitors created/used by this parent
 */
export const getVisitorsList = async (initialMatch, studentMatch, sortOptions, skip, limit, parentIdMatch = null) => {
    const pipeline = [];

    // 1. Initial Match (Status, Date)
    if (Object.keys(initialMatch).length > 0) {
        pipeline.push({ $match: initialMatch });
    }

    // 2. Lookup ALL VisitRequests for this visitor
    pipeline.push({
        $lookup: {
            from: 'visitrequests',
            localField: '_id',
            foreignField: 'visitorId',
            as: 'allRequests'
        }
    });

    // 3. Parent Scope Filter (only visitors who have a visitRequest created by this parent)
    if (parentIdMatch) {
        pipeline.push({
            $match: { 'allRequests.parentId': new mongoose.Types.ObjectId(parentIdMatch) }
        });
    }

    // 4. Lookup Students for filtering and response
    pipeline.push({
        $lookup: {
            from: 'students',
            localField: 'allRequests.studentId',
            foreignField: '_id',
            as: 'studentObj'
        }
    });

    // 5. Staff/Student Scope Filter
    if (Object.keys(studentMatch).length > 0) {
        pipeline.push({ $match: studentMatch });
    }

    // 6. Search text 
    if (sortOptions.search) {
        const searchRegex = new RegExp(sortOptions.search, 'i');
        pipeline.push({
            $match: {
                $or: [
                    { name: searchRegex },
                    { phone: searchRegex },
                    { email: searchRegex },
                    { 'studentObj.name': searchRegex },
                    { 'studentObj.roomNumber': searchRegex }
                ]
            }
        });
    }

    // 6. Sort
    let sortStage = { createdAt: -1 };
    if (sortOptions.sort) {
        if (sortOptions.sort === 'name' || sortOptions.sort === 'name_asc') sortStage = { name: 1 };
        else if (sortOptions.sort === '-name') sortStage = { name: -1 };
        else if (sortOptions.sort === 'createdAt' || sortOptions.sort === 'oldest') sortStage = { createdAt: 1 };
        else if (sortOptions.sort === '-createdAt') sortStage = { createdAt: -1 };
    }
    pipeline.push({ $sort: sortStage });

    // 7. Pagination & Projection via Facet
    pipeline.push({
        $facet: {
            metadata: [{ $count: 'total' }],
            data: [
                { $skip: skip },
                { $limit: limit },
                {
                    $project: {
                        visitorId: '$_id', // backwards compat
                        name: 1,
                        phone: 1,
                        email: 1,
                        status: '$approvalStatus', // backwards compat
                        approvalStatus: 1,
                        createdAt: 1,
                        updatedAt: 1,
                        latestRequestDate: { $max: '$allRequests.createdAt' },
                        activeRequestsCount: {
                            $size: {
                                $filter: {
                                    input: '$allRequests',
                                    as: 'req',
                                    cond: { $in: ['$$req.status', ['Pending', 'Approved']] }
                                }
                            }
                        },
                        studentCount: { $size: '$studentObj' },
                        students: {
                            $map: {
                                input: '$studentObj',
                                as: 's',
                                in: {
                                    _id: '$$s._id',
                                    name: '$$s.name',
                                    roomNumber: '$$s.roomNumber',
                                    hostelId: '$$s.hostelId',
                                    phone: '$$s.phone',
                                    email: '$$s.email'
                                }
                            }
                        }
                    }
                }
            ]
        }
    });

    const result = await Visitor.aggregate(pipeline);
    const data = result[0]?.data || [];
    const total = result[0]?.metadata[0]?.total || 0;

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
    const visitor = await Visitor.findById(visitorId)
        .populate({
            path: 'students',
            select: 'name hostelId roomNumber'
        })
        .populate({
            path: 'organizationId',
            select: 'name'
        })
        .lean();

    if (visitor && visitor.changeLog && visitor.changeLog.length > 0) {
        for (let i = 0; i < visitor.changeLog.length; i++) {
            const timelineEvent = visitor.changeLog[i];
            if (timelineEvent.performedBy) {
                // Try fetching from User collection
                let userDoc = await User.findById(timelineEvent.performedBy, 'name role').lean();
                if (!userDoc) {
                    // Fallback to Parent collection
                    let parentDoc = await Parent.findById(timelineEvent.performedBy, 'parentName').lean();
                    if (parentDoc) {
                        userDoc = {
                            _id: parentDoc._id,
                            name: parentDoc.parentName || 'Parent',
                            role: 'parent'
                        };
                    }
                }

                if (userDoc) {
                    timelineEvent.performedBy = userDoc;
                }
            }
        }
    }

    return visitor;
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
 * Finds an active visit for a specific visitor or parent
 * @param {String} refId 
 * @param {String} refType 
 * @returns {Promise<Object>}
 */
export const findActiveVisit = async (refId, refType) => {
    return await VisitorVisit.findOne({
        'visitor.refId': refId,
        'visitor.refType': refType,
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
    ];

    return [];
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
/**
 * Super Admin Hostel Visitor Aggregation
 * @param {Object} matchStage 
 * @param {Object} searchMatchStage 
 * @param {Number} skip 
 * @param {Number} limit 
 * @param {Object} sortStage 
 * @returns {Promise<Object>} { data, total }
 */
export const getSuperAdminHostelVisitorSummaryAggregated = async (matchStage, searchMatchStage, skip, limit, sortStage) => {
    const pipeline = [
        { $match: matchStage },
        // Lookup students to get hostelId
        {
            $lookup: {
                from: 'students',
                localField: 'studentId',
                foreignField: '_id',
                as: 'studentDocs'
            }
        },
        // We can get the hostelId from the first student since they are validated to belong to the same hostel
        {
            $addFields: {
                hostelId: { $arrayElemAt: ['$studentDocs.hostelId', 0] }
            }
        },
        {
            $group: {
                _id: '$hostelId',
                uniqueVisitors: { $addToSet: '$visitorId' },
                uniquePending: {
                    $addToSet: {
                        $cond: [{ $eq: ['$status', 'Pending'] }, '$visitorId', null]
                    }
                },
                uniqueApproved: {
                    $addToSet: {
                        $cond: [{ $eq: ['$status', 'Approved'] }, '$visitorId', null]
                    }
                }
            }
        },
        {
            $addFields: {
                totalVisitors: { $size: '$uniqueVisitors' },
                pendingApprovals: {
                    $size: {
                        $filter: {
                            input: '$uniquePending',
                            as: 'id',
                            cond: { $ne: ['$$id', null] }
                        }
                    }
                },
                approvedVisitors: {
                    $size: {
                        $filter: {
                            input: '$uniqueApproved',
                            as: 'id',
                            cond: { $ne: ['$$id', null] }
                        }
                    }
                }
            }
        },
        // Lookup Hostel info
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
            $project: {
                _id: 0,
                hostelId: '$_id',
                hostelName: '$hostelInfo.name',
                hostelCode: '$hostelInfo.code',
                totalVisitors: 1,
                pendingApprovals: 1,
                approvedVisitors: 1
            }
        },
        { $match: searchMatchStage },
        { $sort: sortStage },
        {
            $facet: {
                metadata: [{ $count: 'total' }],
                data: [{ $skip: skip }, { $limit: limit }]
            }
        }
    ];

    const result = await VisitRequest.aggregate(pipeline);

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
            path: 'visitor.refId',
            select: 'name parentName phone relationship address idProofType idProofNumber email'
        })
        .populate({
            path: 'students',
            select: 'name studentId roomNumber studentId',
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

/**
 * Fetches expired visits that need to be auto-completed.
 * @param {Number} batchSize Limit the number of documents to process in one go
 * @returns {Promise<Array>}
 */
export const getExpiredVisits = async (batchSize = 50) => {
    return await VisitorVisit.find({
        status: VISITOR_VISIT_STATUS.CHECKED_IN,
        expectedExitTime: { $lte: new Date() }
    })
        .select('_id checkInTime expectedExitTime visitor students hostelId organizationId')
        .populate({
            path: 'visitor.refId',
            select: 'name parentName phone'
        })
        .populate({
            path: 'students',
            select: 'name studentId'
        })
        .limit(batchSize)
        .lean();
};

/**
 * Atomically updates a visit status to Completed and pushes to the timeline.
 * @param {String} visitId 
 * @param {Date} completionTime 
 * @returns {Promise<Object>}
 */
export const autoCompleteVisit = async (visitId, completionTime = new Date()) => {
    return await VisitorVisit.findByIdAndUpdate(
        visitId,
        {
            $set: {
                status: VISITOR_VISIT_STATUS.COMPLETED,
                checkOutTime: completionTime,
                checkedOutBy: null
            },
            $push: {
                visitTimeline: {
                    action: VISITOR_VISIT_TIMELINE_ACTIONS.AUTO_CHECKED_OUT,
                    performedBy: null, // System action
                    remarks: 'Visit automatically completed after scheduled duration.',
                    createdAt: completionTime
                }
            }
        },
        { new: true, runValidators: true }
    );
};

/**
 * Updates allowed fields of a visitor
 * @param {String} visitorId
 * @param {Object} updateData
 * @returns {Promise<Object>}
 */
export const updateVisitor = async (visitorId, updateData) => {
    return await Visitor.findByIdAndUpdate(
        visitorId,
        { $set: updateData },
        { new: true, runValidators: true }
    ).select('name phone email address updatedAt');
};



/**
 * Parent Module: Gets a specific Visitor's VisitRequests linked to a specific Parent
 */
export const getParentVisitRequests = async (visitorId, parentId) => {
    return await VisitRequest.find({ visitorId, parentId })
        .populate('studentId', 'name roomNumber')
        .sort({ createdAt: -1 })
        .lean();
};

// ============================================================================
// Multi-Student Approval Methods
// ============================================================================

/**
 * Fetches all Pending VisitRequests for a visitor, populated with student auth data
 * @param {String} visitorId 
 * @returns {Promise<Array>}
 */
export const getPendingVisitRequestsByVisitor = async (visitorId) => {
    return await VisitRequest.find({
        visitorId,
        status: 'Pending'
    })
        .populate('studentId', 'name organizationId batchId hostelId')
        .lean();
};

/**
 * Atomically updates multiple VisitRequests from Pending to the new status
 * @param {Array<String>} requestIds 
 * @param {String} newStatus 
 * @param {Object} timelineEntry 
 * @returns {Promise<Object>} Mongoose Update Result
 */
export const bulkUpdateVisitRequestStatus = async (requestIds, newStatus, timelineEntry) => {
    return await VisitRequest.updateMany(
        {
            _id: { $in: requestIds },
            status: 'Pending' // Optimistic lock condition
        },
        {
            $set: { status: newStatus },
            $push: { approvalTimeline: timelineEntry }
        }
    );
};


/**
 * Finds a single VisitRequest and populates its student with auth data
 * @param {String} visitRequestId 
 * @param {Object} session Optional mongoose session
 */
export const findVisitRequestWithAuthorizationData = async (visitRequestId, session = null) => {
    return await VisitRequest.findById(visitRequestId)
        .populate('studentId', 'organizationId batchId hostelId')
        .session(session)
        .lean();
};

/**
 * Approves a single VisitRequest
 * @param {String} visitRequestId 
 * @param {Object} timelineEntry 
 * @param {Object} session 
 */
export const approveVisitRequest = async (visitRequestId, timelineEntry, session = null) => {
    return await VisitRequest.findByIdAndUpdate(
        visitRequestId,
        {
            $set: {
                status: VISITOR_STATUS.APPROVED
            },
            $push: { approvalTimeline: timelineEntry }
        },
        { new: true, session }
    );
};

/**
 * Rejects a single VisitRequest
 * @param {String} visitRequestId 
 * @param {Object} timelineEntry 
 * @param {Object} session 
 */
export const rejectVisitRequest = async (visitRequestId, timelineEntry, session = null) => {
    return await VisitRequest.findByIdAndUpdate(
        visitRequestId,
        {
            $set: { status: 'Rejected' },
            $push: { approvalTimeline: timelineEntry }
        },
        { new: true, session }
    );
};

/**
 * Adds students to an actively checked-in visit
 * @param {String} visitId 
 * @param {Array<String>} newStudentIds 
 * @param {Object} timelineEntry 
 */
export const addStudentsToActiveVisit = async (visitId, newStudentIds, timelineEntry) => {
    return await VisitorVisit.findByIdAndUpdate(
        visitId,
        {
            $addToSet: {
                students: { $each: newStudentIds }
            },
            $push: {
                visitTimeline: timelineEntry
            }
        },
        { new: true }
    );
};
