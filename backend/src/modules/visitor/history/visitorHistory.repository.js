import visitorVisitModel from "../visitorVisit.model.js";
import { VISITOR_VISIT_STATUS } from "../visitor.constant.js";

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

    const result = await visitorVisitModel.aggregate(pipeline);

    const data = result[0].data;
    const total = result[0].metadata[0] ? result[0].metadata[0].total : 0;

    return { data, total };
};



export const getVisitorVisits = async (matchStage, searchMatchStage, sortStage, skip, limit) => {
    const pipeline = [
        { $match: matchStage },
        // Extract refId safely to ensure $lookup can resolve it reliably
        {
            $addFields: {
                tempVisitorRefId: "$visitor.refId",
                tempVisitorRefType: "$visitor.refType"
            }
        },
        // Lookup Visitor or Parent (Polymorphic)
        {
            $lookup: {
                from: 'visitors',
                localField: 'tempVisitorRefId',
                foreignField: '_id',
                as: 'visitorDocs'
            }
        },
        {
            $lookup: {
                from: 'parents',
                localField: 'tempVisitorRefId',
                foreignField: '_id',
                as: 'parentDocs'
            }
        },
        { $unwind: { path: '$visitorDocs', preserveNullAndEmptyArrays: true } },
        { $unwind: { path: '$parentDocs', preserveNullAndEmptyArrays: true } },
        {
            $addFields: {
                visitorInfo: {
                    name: {
                        $cond: {
                            if: { $eq: ['$tempVisitorRefType', 'Visitor'] },
                            then: '$visitorDocs.name',
                            else: '$parentDocs.parentName'
                        }
                    },
                    phone: {
                        $cond: {
                            if: { $eq: ['$tempVisitorRefType', 'Visitor'] },
                            then: '$visitorDocs.phone',
                            else: '$parentDocs.phone'
                        }
                    }
                }
            }
        },
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
                    $reduce: {
                        input: "$studentDocs.roomNumber",
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
                { $project: { visitorPhone: 0 } }
            ]
        }
    });

    const result = await visitorVisitModel.aggregate(pipeline);

    const data = result[0].data;
    const total = result[0].metadata[0] ? result[0].metadata[0].total : 0;

    return { data, total };
};
