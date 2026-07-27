import mongoose from "mongoose";
import Pass from "./pass.model.js";
import Parent from "../parents/parent.model.js";
import Hostel from "../hostels/hostel.model.js";
import Organization from "../organizations/organization.model.js";
import Student from "../students/student.model.js";
import {
  buildDateRangeFilter,
  buildStatusFilter,
  buildPaginationFacet,
  buildSearchMatch,
  formatPaginationResponse,
  buildDashboardStatsFacet,
  parseDashboardStatsFacet
} from "./pass.aggregation.js";
import hostelModel from "../hostels/hostel.model.js";

// --- Helpers ---

// Date filter helper is moved to aggregation.js but kept here for backward compatibility for non-management services
const applyDateRangeFilter = (filter, field, startDate, endDate) => {
  buildDateRangeFilter(filter, field, startDate, endDate);
};

const applyPassDateFilter = (filter, query) => {
  if (query.startDate || query.endDate) {
    if (query.passType === 'home_pass') {
      buildDateRangeFilter(filter, 'fromDate', query.startDate, query.endDate);
    } else if (query.passType === 'out_pass') {
      buildDateRangeFilter(filter, 'date', query.startDate, query.endDate);
    } else {
      const tempFilter = {};
      buildDateRangeFilter(tempFilter, 'temp', query.startDate, query.endDate);
      if (tempFilter.temp) {
        filter.$or = [
          { fromDate: tempFilter.temp },
          { date: tempFilter.temp }
        ];
      }
    }
  }
};

export const createPassDb = async (passData, session = null) => {
  const result = await Pass.create([passData], { session: session || undefined });
  return result[0];
};

export const getStudentPassesDb = async (studentId, query) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter = { studentId: new mongoose.Types.ObjectId(studentId) };

  if (query.status) filter.status = query.status;
  if (query.passType) filter.passType = query.passType;
  if (query.outTime) filter.outTime = query.outTime;
  if (query.outPassCategory || query.category) filter.outPassCategory = query.outPassCategory || query.category;

  applyDateRangeFilter(filter, "fromDate", query.startDate || query.fromDate, query.endDate || query.toDate);

  if (query.date) {
    const searchDate = new Date(query.date);
    searchDate.setUTCHours(0, 0, 0, 0);
    const endSearchDate = new Date(query.date);
    endSearchDate.setUTCHours(23, 59, 59, 999);
    filter.date = { $gte: searchDate, $lte: endSearchDate };
  }

  const pipeline = [
    { $match: filter },
    { $sort: { createdAt: -1 } },
    {
      $facet: {
        metadata: [{ $count: "totalRecords" }],
        data: [
          { $skip: skip },
          { $limit: limit },
          {
            $lookup: {
              from: "parents",
              localField: "parentId",
              foreignField: "_id",
              as: "parentInfo"
            }
          },
          { $unwind: { path: "$parentInfo", preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: "hostels",
              localField: "hostelId",
              foreignField: "_id",
              as: "hostelInfo"
            }
          },
          { $unwind: { path: "$hostelInfo", preserveNullAndEmptyArrays: true } },
          {
            $project: {
              _id: 1,
              passType: 1,
              outPassCategory: 1,
              status: 1,
              reason: 1,
              fromDate: 1,
              toDate: 1,
              date: 1,
              totalDays: 1,
              outTime: 1,
              expectedReturnTime: 1,
              createdAt: 1,
              returnTracking: { returnStatus: 1, leftHostelAt: 1, returnedAt: 1, markedBy: 1, markedAt: 1 },
              parentInfo: { parentName: "$parentInfo.parentName" },
              hostelId: { name: "$hostelInfo.name" }
            }
          }
        ]
      }
    }
  ];
  const stats = await Pass.aggregate(pipeline);
  const totalRecords = stats[0].metadata[0]?.totalRecords || 0;
  const totalPages = Math.ceil(totalRecords / limit);
  return {
    passes: stats[0].data,
    pagination: {
      page,
      limit,
      totalRecords,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    },
  };
};

export const getPassByIdDb = async (passId) => {
  return await Pass.findById(passId);
};

export const updatePassDb = async (passId, updateData, session = null) => {
  return await Pass.findByIdAndUpdate(passId, updateData, { new: true, runValidators: true, session });
};

export const addTimelineEventDb = async (passId, timelineEvent, session = null) => {
  return await Pass.findByIdAndUpdate(
    passId,
    { $push: { timeline: timelineEvent } },
    { new: true, session }
  );
};

export const getDashboardStatsDb = async (studentId) => {
  const stats = await Pass.aggregate([
    { $match: { studentId: new mongoose.Types.ObjectId(studentId) } },
    {
      $facet: {
        total: [{ $count: "count" }],
        pending: [{ $match: { status: "pending_parent" } }, { $count: "count" }],
        approved: [{ $match: { "parentApproval.status": "approved" } }, { $count: "count" }],
        rejected: [{ $match: { "parentApproval.status": "rejected" } }, { $count: "count" }]
      }
    }
  ]);

  const result = stats[0];
  return {
    total: result.total[0]?.count || 0,
    pending: result.pending[0]?.count || 0,
    approved: result.approved[0]?.count || 0,
    rejected: result.rejected[0]?.count || 0
  };
};

export const getPassesDb = async (studentId, query) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter = { studentId: new mongoose.Types.ObjectId(studentId) };

  if (query.status) filter.status = query.status;
  if (query.passType) filter.passType = query.passType;
  if (query.outPassCategory || query.category) filter.outPassCategory = query.outPassCategory || query.category;

  applyDateRangeFilter(filter, "createdAt", query.startDate || query.fromDate, query.endDate || query.toDate);

  const stats = await Pass.aggregate([
    { $match: filter },
    { $sort: { createdAt: -1 } },
    {
      $facet: {
        metadata: [{ $count: "totalRecords" }],
        data: [
          { $skip: skip },
          { $limit: limit },
          {
            $lookup: {
              from: "students",
              localField: "studentId",
              foreignField: "_id",
              as: "studentInfo"
            }
          },
          { $unwind: { path: "$studentInfo", preserveNullAndEmptyArrays: true } },
          {
            $project: {
              _id: 1,
              passType: 1,
              outPassCategory: 1,
              reason: 1,
              status: 1,
              fromDate: 1,
              toDate: 1,
              date: 1,
              outTime: 1,
              expectedReturnTime: 1,
              returnTracking: 1,
              studentName: "$studentInfo.name",
              admissionNumber: "$studentInfo.studentId",
              parentApprovalStatus: "$parentApproval.status",
              adminApprovalStatus: "$adminApproval.status"
            }
          }
        ]
      }
    }
  ]);

  const totalRecords = stats[0].metadata[0]?.totalRecords || 0;
  const totalPages = Math.ceil(totalRecords / limit);

  return {
    passes: stats[0].data,
    pagination: {
      page,
      limit,
      totalRecords,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    },
  };
};

export const getPassDetailsDb = async (passId, studentId) => {
  return await Pass.findOne({ _id: passId, studentId })
    .populate("studentId", "name studentId roomNumber")
    .populate("hostelId", "name")
    .lean();
};

export const updatePassApprovalDb = async (passId, parentId, action, remarks, session = null) => {
  const statusUpdate = action === "approve" ? "pending_admin" : "rejected";
  const parentStatus = action === "approve" ? "approved" : "rejected";
  const timelineAction = action === "approve" ? "parent_approved" : "parent_rejected";
  const defaultRemark = action === "approve" ? "Approved by parent" : "Rejected by parent";

  return await Pass.findOneAndUpdate(
    { _id: passId },
    {
      $set: {
        status: statusUpdate,
        "parentApproval.status": parentStatus,
        "parentApproval.actionBy": parentId,
        "parentApproval.actionAt": new Date(),
        "parentApproval.remarks": remarks || ""
      },
      $push: {
        timeline: {
          action: timelineAction,
          actorId: parentId,
          actorRole: "parent",
          remarks: remarks || defaultRemark,
          timestamp: new Date()
        }
      }
    },
    { new: true, session }
  ).populate("studentId", "name studentId roomNumber");
};

export const getParentDb = async (parentId) => {
  return await Parent.findById(parentId).lean();
};

// --- Warden Services ---

export const getWardenHostelDb = async (wardenId) => {
  return await Hostel.findOne({ wardens: wardenId, isActive: true }).lean();
};

export const getWardenDashboardStatsDb = async (hostelId) => {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const endOfToday = new Date(today);
  endOfToday.setUTCHours(23, 59, 59, 999);

  const stats = await Pass.aggregate([
    { $match: { hostelId: new mongoose.Types.ObjectId(hostelId) } },
    {
      $facet: {
        total: [{ $count: "count" }],
        approved: [{ $match: { status: "approved" } }, { $count: "count" }],
        studentsOutside: [
          { $match: { "returnTracking.leftHostelAt": { $exists: true, $ne: null }, "returnTracking.returnedAt": null } },
          { $count: "count" }
        ],
        returned: [{ $match: { status: "returned" } }, { $count: "count" }],
        homePassCount: [{ $match: { passType: "home_pass" } }, { $count: "count" }],
        outPassCount: [{ $match: { passType: "out_pass" } }, { $count: "count" }],
        inHousePassCount: [{ $match: { passType: "out_pass", outPassCategory: "in_house" } }, { $count: "count" }],
        outHousePassCount: [{ $match: { passType: "out_pass", outPassCategory: "out_house" } }, { $count: "count" }],
        todayRequests: [{ $match: { createdAt: { $gte: today, $lte: endOfToday } } }, { $count: "count" }],
        todayReturns: [{ $match: { "returnTracking.returnedAt": { $gte: today, $lte: endOfToday } } }, { $count: "count" }]
      }
    }
  ]);

  const result = stats[0];
  return {
    total: result.total[0]?.count || 0,
    approved: result.approved[0]?.count || 0,
    studentsOutside: result.studentsOutside[0]?.count || 0,
    returned: result.returned[0]?.count || 0,
    homePassCount: result.homePassCount[0]?.count || 0,
    outPassCount: result.outPassCount[0]?.count || 0,
    inHousePassCount: result.inHousePassCount[0]?.count || 0,
    outHousePassCount: result.outHousePassCount[0]?.count || 0,
    todayRequests: result.todayRequests[0]?.count || 0,
    todayReturns: result.todayReturns[0]?.count || 0
  };
};

export const getWardenPassesDb = async (hostelId, query) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter = { hostelId, ...buildStatusFilter(query) };
  applyPassDateFilter(filter, query);

  const pipeline = [
    { $match: filter },
    {
      $lookup: {
        from: "students",
        localField: "studentId",
        foreignField: "_id",
        as: "studentInfo"
      }
    },
    { $unwind: { path: "$studentInfo", preserveNullAndEmptyArrays: true } }
  ];

  const searchMatch = buildSearchMatch(query.search, ["studentInfo.name", "studentInfo.studentId", "studentInfo"]);
  if (searchMatch) pipeline.push(searchMatch);

  const projectStage = {
    _id: 1,
    passType: 1,
    outPassCategory: 1,
    status: 1,
    reason: 1,
    fromDate: 1,
    toDate: 1,
    date: 1,
    outTime: 1,
    expectedReturnTime: 1,
    createdAt: 1,
    totalDays: 1,
    returnTracking: 1,
    studentInfo: {
      _id: "$studentInfo._id",
      name: "$studentInfo.name",
      studentId: "$studentInfo.studentId",
      roomNumber: "$studentInfo.roomNumber"
    },
    parentInfo: {
      _id: "$parentInfo._id",
      parentName: "$parentInfo.parentName"
    }
  };

  pipeline.push(
    { $sort: { createdAt: -1 } },
    {
      $lookup: {
        from: "parents",
        localField: "parentId",
        foreignField: "_id",
        as: "parentInfo"
      }
    },
    { $unwind: { path: "$parentInfo", preserveNullAndEmptyArrays: true } },
    buildPaginationFacet(skip, limit, projectStage)
  );

  const stats = await Pass.aggregate(pipeline);
  return formatPaginationResponse(stats, page, limit);
};
export const getManagementDashboardStatsDb = async (scope) => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  let matchQuery = {};
  if (scope.role === "mentor") {
    const studentIds = await Student.distinct('_id', { batchId: { $in: (scope.batchIds || []).map(id => new mongoose.Types.ObjectId(id)) } });
    matchQuery = { studentId: { $in: studentIds.filter(Boolean) } };
  } else if (scope.organizationId) {
    const hostelIds = await Student.distinct('hostelId', { organizationId: new mongoose.Types.ObjectId(scope.organizationId) });
    matchQuery = { hostelId: { $in: hostelIds.filter(Boolean) } };
  }


  const [orgCount, hostelCount, studentCount, passStats] = await Promise.all([
    scope.role === "super_admin" ? Organization.countDocuments({ isActive: true }) : Promise.resolve(0),
    scope.role === "super_admin" ? Hostel.countDocuments({ isActive: true }) : Promise.resolve(0),
    scope.role === "super_admin" ? Student.countDocuments({ isActive: true }) : Promise.resolve(0),
    Pass.aggregate([
      { $match: matchQuery },
      buildDashboardStatsFacet(startOfToday, endOfToday)
    ])
  ]);

  const response = parseDashboardStatsFacet(passStats);

  if (scope.role === "super_admin") {
    response.totalOrganizations = orgCount;
    response.totalHostels = hostelCount;
    response.totalStudents = studentCount;
  }

  return response;
};

export const getManagementHostelsDb = async (scope, query = {}) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const skip = (page - 1) * limit;


  const matchQuery = { isActive: true };
  if (scope.role === "mentor") {
    const hostelIds = await Student.distinct('hostelId', { batchId: { $in: (scope.batchIds || []).map(id => new mongoose.Types.ObjectId(id)) } });
    matchQuery._id = { $in: hostelIds.filter(Boolean) };
  } else if (scope.organizationId && scope.role === "admin") {
    const hostelIds = await Student.distinct('hostelId', { organizationId: new mongoose.Types.ObjectId(scope.organizationId) });
    matchQuery._id = { $in: hostelIds.filter(Boolean) };
  }

  if (query.search) {
    matchQuery.name = { $regex: query.search, $options: "i" };
  }

  const passMatch = { $expr: { $eq: ["$hostelId", "$$hostelId"] } };
  if (query.passType && query.passType !== "all") {
    passMatch.passType = query.passType;
  }

  const pipeline = [
    { $match: matchQuery },
    {
      $lookup: {
        from: "students",
        let: { hostelId: "$_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$hostelId", "$$hostelId"] }, isActive: true } },
          { $count: "studentCount" }
        ],
        as: "studentsInfo"
      }
    },
    {
      $lookup: {
        from: "passes",
        let: { hostelId: "$_id" },
        pipeline: [
          { $match: passMatch },
          {
            $group: {
              _id: null,
              totalCount: { $sum: 1 },
              pendingCount: {
                $sum: { $cond: [{ $in: ["$status", ["pending_parent", "pending_admin"]] }, 1, 0] }
              },
              approvedCount: {
                $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] }
              },
              rejectedCount: {
                $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] }
              },
              outsideCount: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        { $eq: ["$status", "approved"] },
                        { $eq: [{ $type: "$returnTracking.leftHostelAt" }, "date"] },
                        { $in: [{ $type: "$returnTracking.returnedAt" }, ["missing", "null"]] }
                      ]
                    },
                    1,
                    0
                  ]
                }
              }
            }
          }
        ],
        as: "passStats"
      }
    },
    {
      $project: {
        _id: 1,
        hostel: "$name",
        students: { $arrayElemAt: ["$studentsInfo.studentCount", 0] },
        total: { $arrayElemAt: ["$passStats.totalCount", 0] },
        pending: { $arrayElemAt: ["$passStats.pendingCount", 0] },
        approved: { $arrayElemAt: ["$passStats.approvedCount", 0] },
        rejected: { $arrayElemAt: ["$passStats.rejectedCount", 0] },
        outside: { $arrayElemAt: ["$passStats.outsideCount", 0] }
      }
    },
    {
      $addFields: {
        students: { $ifNull: ["$students", 0] },
        total: { $ifNull: ["$total", 0] },
        pending: { $ifNull: ["$pending", 0] },
        approved: { $ifNull: ["$approved", 0] },
        rejected: { $ifNull: ["$rejected", 0] },
        outside: { $ifNull: ["$outside", 0] }
      }
    },
    { $match: { total: { $gt: 0 } } },
    { $sort: { hostel: 1 } },
    {
      $facet: {
        metadata: [{ $count: "totalRecords" }],
        data: [
          { $skip: skip },
          { $limit: limit }
        ]
      }
    }
  ];

  const result = await Hostel.aggregate(pipeline);
  const totalRecords = result[0]?.metadata[0]?.totalRecords || 0;
  const totalPages = Math.ceil(totalRecords / limit);

  return {
    hostels: result[0]?.data || [],
    pagination: {
      page,
      limit,
      totalRecords,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    }
  };
};

export const getManagementPassesDb = async (
  query,
  scope,
  specificHostelId = null
) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const filter = {
    ...buildStatusFilter(query),
  };

  if (query.passType) {
    filter.passType = query.passType;
  }

  if (specificHostelId) {
    filter.hostelId = new mongoose.Types.ObjectId(specificHostelId);
  } else if (query.hostelId) {
    filter.hostelId = new mongoose.Types.ObjectId(query.hostelId);
  }

  applyPassDateFilter(filter, query);

  const studentLookupPipeline = [
    {
      $match: {
        $expr: {
          $eq: ["$_id", "$$studentId"],
        },
      },
    },
  ];

  // Restrict only Admin users to their organization
  if (scope.role === "admin") {
    studentLookupPipeline.push({
      $match: {
        organizationId: new mongoose.Types.ObjectId(scope.organizationId),
      },
    });
  } else if (scope.role === "mentor") {
    studentLookupPipeline.push({
      $match: {
        batchId: { $in: (scope.batchIds || []).map(id => new mongoose.Types.ObjectId(id)) },
      },
    });
  }

  const pipeline = [
    {
      $match: filter,
    },

    {
      $lookup: {
        from: "students",
        let: {
          studentId: "$studentId",
        },
        pipeline: studentLookupPipeline,
        as: "studentInfo",
      },
    },

    // Removes passes that don't belong to the admin's organization
    {
      $unwind: "$studentInfo",
    },

    {
      $lookup: {
        from: "hostels",
        localField: "hostelId",
        foreignField: "_id",
        as: "hostelInfo",
      },
    },

    {
      $unwind: {
        path: "$hostelInfo",
        preserveNullAndEmptyArrays: true,
      },
    },
  ];

  const searchMatch = buildSearchMatch(query.search, [
    "studentInfo.name",
    "studentInfo.studentId",
    "studentInfo.roomNumber",
    "hostelInfo.name",
  ]);

  if (searchMatch) {
    pipeline.push(searchMatch);
  }

  pipeline.push({
    $addFields: {
      sortPriority: {
        $switch: {
          branches: [
            {
              case: { $eq: ["$status", "pending_admin"] },
              then: 1,
            },
            {
              case: { $eq: ["$status", "pending_parent"] },
              then: 2,
            },
            {
              case: { $eq: ["$status", "approved"] },
              then: 3,
            },
            {
              case: { $eq: ["$status", "returned"] },
              then: 4,
            },
            {
              case: { $eq: ["$status", "completed"] },
              then: 5,
            },
            {
              case: { $eq: ["$status", "cancelled"] },
              then: 6,
            },
            {
              case: { $eq: ["$status", "rejected"] },
              then: 7,
            },
          ],
          default: 8,
        },
      },
    },
  });

  const projectStage = {
    _id: 1,
    passType: 1,
    outPassCategory: 1,
    status: 1,
    reason: 1,
    fromDate: 1,
    toDate: 1,
    date: 1,
    outTime: 1,
    totalDays: 1,
    expectedReturnTime: 1,
    createdAt: 1,

    returnTracking: {
      returnStatus: 1,
    },

    studentInfo: {
      _id: "$studentInfo._id",
      name: "$studentInfo.name",
      studentId: "$studentInfo.studentId",
      roomNumber: "$studentInfo.roomNumber",
    },

    hostelInfo: {
      _id: "$hostelInfo._id",
      name: "$hostelInfo.name",
    },
  };

  pipeline.push(
    {
      $sort: {
        sortPriority: 1,
        createdAt: 1,
      },
    },
    buildPaginationFacet(skip, limit, projectStage)
  );

  const result = await Pass.aggregate(pipeline);

  return formatPaginationResponse(result, page, limit);
};

export const getManagementPassDetailsDb = async (passId) => {
  const pipeline = [
    { $match: { _id: new mongoose.Types.ObjectId(passId) } },
    {
      $lookup: {
        from: "students",
        localField: "studentId",
        foreignField: "_id",
        as: "student"
      }
    },
    { $unwind: { path: "$student", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "courses",
        localField: "student.courseId",
        foreignField: "_id",
        as: "courseInfo"
      }
    },
    { $unwind: { path: "$courseInfo", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "departments",
        localField: "student.departmentId",
        foreignField: "_id",
        as: "departmentInfo"
      }
    },
    { $unwind: { path: "$departmentInfo", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "parents",
        localField: "parentId",
        foreignField: "_id",
        as: "parent"
      }
    },
    { $unwind: { path: "$parent", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "hostels",
        localField: "hostelId",
        foreignField: "_id",
        as: "hostel"
      }
    },
    { $unwind: { path: "$hostel", preserveNullAndEmptyArrays: true } },
    {
      $addFields: {
        studentId: {
          _id: "$student._id",
          name: "$student.name",
          studentId: "$student.studentId",
          course: "$courseInfo.name",
          department: "$departmentInfo.name",
          roomNumber: "$student.roomNumber"
        },
        parentId: {
          _id: "$parent._id",
          parentName: "$parent.parentName",
          phone: "$parent.phone",
          relationship: "$parent.relationship"
        },
        hostelId: {
          _id: "$hostel._id",
          name: "$hostel.name"
        }
      }
    },
    {
      $project: {
        student: 0,
        courseInfo: 0,
        departmentInfo: 0,
        parent: 0,
        hostel: 0
      }
    }
  ];

  const result = await Pass.aggregate(pipeline);
  return result[0] || null;
};

export const managementCancelPassDb = async (passId, reason, scope, session = null) => {
  const updateQuery = {
    $set: { status: "cancelled" },
    $push: {
      timeline: {
        action: "admin_cancelled",
        actorId: scope.actorId,
        actorRole: scope.role,
        remarks: `Administrative Cancellation: ${reason}`,
        timestamp: new Date()
      }
    }
  };

  // We enforce that the student has not left the hostel and the pass is not already completed/cancelled
  const filter = {
    _id: passId,
    status: { $nin: ["completed", "cancelled", "rejected", "returned"] },
    "returnTracking.leftHostelAt": null
  };

  return await Pass.findOneAndUpdate(filter, updateQuery, { new: true, session });
};

export const getWardenPassDetailsDb = async (passId, hostelId) => {
  return await Pass.findOne({ _id: passId, hostelId })
    .populate("studentId", "name  studentId roomNumber")
    .populate("parentId", "parentName phone relationship")
    .populate("hostelId", "name")
    .populate("adminApproval.actionBy", "name")
    .lean();
};

export const updateWardenPassWorkflowDb = async (passId, hostelId, updateQuery, session = null) => {
  return await Pass.findOneAndUpdate(
    { _id: passId, hostelId },
    updateQuery,
    { new: true, session }
  ).populate("studentId", "name studentId");
};

// ─── Unified Pass Listing ────────────────────────────────────────────────────

/**
 * Shared helper: build a smart date filter that handles home_pass and out_pass
 * date fields correctly when passType may or may not be specified.
 */
const buildUnifiedDateFilter = (filter, passType, fromDate, toDate) => {
  if (!fromDate && !toDate) return;

  const rangeCondition = (field) => {
    const cond = {};
    if (fromDate) {
      const s = new Date(fromDate);
      s.setUTCHours(0, 0, 0, 0);
      cond.$gte = s;
    }
    if (toDate) {
      const e = new Date(toDate);
      e.setUTCHours(23, 59, 59, 999);
      cond.$lte = e;
    }
    return { [field]: cond };
  };

  if (passType === "home_pass") {
    Object.assign(filter, rangeCondition("fromDate"));
  } else if (passType === "out_pass") {
    Object.assign(filter, rangeCondition("date"));
  } else {
    // No passType specified — match either home_pass fromDate OR out_pass date
    const cond = {};
    if (fromDate) {
      const s = new Date(fromDate);
      s.setUTCHours(0, 0, 0, 0);
      cond.$gte = s;
    }
    if (toDate) {
      const e = new Date(toDate);
      e.setUTCHours(23, 59, 59, 999);
      cond.$lte = e;
    }
    filter.$or = [{ fromDate: cond }, { date: cond }];
  }
};

/** Status buckets for the two modes */
const REQUEST_STATUSES = ["pending_parent", "pending_admin", "approved"];
const HISTORY_STATUSES = ["rejected", "cancelled", "returned", "completed"];

/**
 * Build the base match filter from unified query params.
 * Used by both student and parent listing.
 */
const buildUnifiedMatchFilter = (baseFilter, query) => {
  const filter = { ...baseFilter };

  // Mode → status bucket (overridden if explicit ?status= is provided)
  if (query.status) {
    filter.status = query.status;
  } else {
    const mode = query.mode === "history" ? "history" : "requests";
    filter.status = { $in: mode === "history" ? HISTORY_STATUSES : REQUEST_STATUSES };
  }

  if (query.passType) filter.passType = query.passType;
  if (query.category) filter.outPassCategory = query.category;
  if (query.outTime) filter.outTime = query.outTime;
  if (query.returnTime) filter.expectedReturnTime = query.returnTime;

  buildUnifiedDateFilter(filter, query.passType, query.fromDate, query.toDate);

  return filter;
};

// ─── Student Unified Listing ─────────────────────────────────────────────────

export const getStudentPassesUnifiedDb = async (studentId, query) => {
  const page = Math.max(parseInt(query.page) || 1, 1);
  const limit = Math.min(parseInt(query.limit) || 10, 50);
  const skip = (page - 1) * limit;

  const sortField = ["createdAt", "fromDate", "date"].includes(query.sortBy) ? query.sortBy : "createdAt";
  const sortDir = query.sortOrder === "asc" ? 1 : -1;

  const baseFilter = { studentId: new mongoose.Types.ObjectId(studentId) };
  const filter = buildUnifiedMatchFilter(baseFilter, query);

  // Summary counts are always scoped to student, mode-independent
  const summaryPipeline = [
    { $match: { studentId: new mongoose.Types.ObjectId(studentId) } },
    {
      $facet: {
        total: [{ $count: "count" }],
        approved: [{ $match: { status: "approved" } }, { $count: "count" }],
        pending: [
          { $match: { status: { $in: ["pending_parent", "pending_admin"] } } },
          { $count: "count" }
        ]
      }
    }
  ];

  const listPipeline = [
    { $match: filter },
    { $sort: { [sortField]: sortDir, createdAt: -1 } },
    {
      $lookup: {
        from: "parents",
        localField: "parentId",
        foreignField: "_id",
        as: "parentInfo"
      }
    },
    { $unwind: { path: "$parentInfo", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "hostels",
        localField: "hostelId",
        foreignField: "_id",
        as: "hostelInfo"
      }
    },
    { $unwind: { path: "$hostelInfo", preserveNullAndEmptyArrays: true } }
  ];

  // Search by reason
  if (query.search) {
    const regex = new RegExp(query.search, "i");
    listPipeline.push({ $match: { reason: regex } });
  }

  const projectStage = {
    _id: 1,
    passType: 1,
    outPassCategory: 1,
    status: 1,
    reason: 1,
    fromDate: 1,
    toDate: 1,
    date: 1,
    totalDays: 1,
    outTime: 1,
    expectedReturnTime: 1,
    createdAt: 1,
    changeInfo: { edited: 1, editedBy: 1, editedAt: 1 },
    cancellationRequest: { requested: 1, requestedBy: 1 },
    parentApproval: { status: 1, remarks: 1 },
    adminApproval: { status: 1, remarks: 1 },
    returnTracking: { returnStatus: 1, leftHostelAt: 1, returnedAt: 1 },
    parentInfo: { _id: "$parentInfo._id", parentName: "$parentInfo.parentName" },
    hostelInfo: { _id: "$hostelInfo._id", name: "$hostelInfo.name" }
  };

  listPipeline.push({
    $facet: {
      metadata: [{ $count: "totalRecords" }],
      data: [{ $skip: skip }, { $limit: limit }, { $project: projectStage }]
    }
  });

  const [summaryResult, listResult] = await Promise.all([
    Pass.aggregate(summaryPipeline),
    Pass.aggregate(listPipeline)
  ]);

  const sr = summaryResult[0];
  const totalRecords = listResult[0]?.metadata[0]?.totalRecords || 0;
  const totalPages = Math.ceil(totalRecords / limit);

  return {
    mode: query.status ? "filtered" : (query.mode === "history" ? "history" : "requests"),
    summary: {
      total: sr?.total[0]?.count || 0,
      approved: sr?.approved[0]?.count || 0,
      pending: sr?.pending[0]?.count || 0
    },
    passes: listResult[0]?.data || [],
    pagination: {
      page,
      limit,
      totalRecords,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    }
  };
};

// ─── Parent Unified Listing ──────────────────────────────────────────────────

export const getParentPassesUnifiedDb = async (studentId, query) => {
  const page = Math.max(parseInt(query.page) || 1, 1);
  const limit = Math.min(parseInt(query.limit) || 10, 50);
  const skip = (page - 1) * limit;

  const sortField = ["createdAt", "fromDate", "date"].includes(query.sortBy) ? query.sortBy : "createdAt";
  const sortDir = query.sortOrder === "asc" ? 1 : -1;

  const baseFilter = { studentId: new mongoose.Types.ObjectId(studentId) };
  const filter = buildUnifiedMatchFilter(baseFilter, query);

  // Summary counts
  const summaryPipeline = [
    { $match: { studentId: new mongoose.Types.ObjectId(studentId) } },
    {
      $facet: {
        total: [{ $count: "count" }],
        approved: [{ $match: { status: "approved" } }, { $count: "count" }],
        pending: [
          { $match: { status: { $in: ["pending_parent", "pending_admin"] } } },
          { $count: "count" }
        ]
      }
    }
  ];

  const listPipeline = [
    { $match: filter },
    {
      $lookup: {
        from: "students",
        localField: "studentId",
        foreignField: "_id",
        as: "studentInfo"
      }
    },
    { $unwind: { path: "$studentInfo", preserveNullAndEmptyArrays: true } }
  ];

  // Search by reason or student name
  if (query.search) {
    const regex = new RegExp(query.search, "i");
    listPipeline.push({
      $match: {
        $or: [{ reason: regex }, { "studentInfo.name": regex }]
      }
    });
  }

  listPipeline.push({ $sort: { [sortField]: sortDir, createdAt: -1 } });

  const projectStage = {
    _id: 1,
    passType: 1,
    outPassCategory: 1,
    status: 1,
    reason: 1,
    fromDate: 1,
    toDate: 1,
    date: 1,
    totalDays: 1,
    outTime: 1,
    expectedReturnTime: 1,
    createdAt: 1,
    cancellationRequest: { requested: 1, requestedBy: 1 },
    parentApproval: { status: 1, remarks: 1 },
    adminApproval: { status: 1, remarks: 1 },
    returnTracking: { returnStatus: 1, leftHostelAt: 1, returnedAt: 1 },
    studentInfo: {
      _id: "$studentInfo._id",
      name: "$studentInfo.name",
      studentId: "$studentInfo.studentId",
      roomNumber: "$studentInfo.roomNumber"
    }
  };

  listPipeline.push({
    $facet: {
      metadata: [{ $count: "totalRecords" }],
      data: [{ $skip: skip }, { $limit: limit }, { $project: projectStage }]
    }
  });

  const [summaryResult, listResult] = await Promise.all([
    Pass.aggregate(summaryPipeline),
    Pass.aggregate(listPipeline)
  ]);

  const sr = summaryResult[0];
  const totalRecords = listResult[0]?.metadata[0]?.totalRecords || 0;
  const totalPages = Math.ceil(totalRecords / limit);

  return {
    mode: query.status ? "filtered" : (query.mode === "history" ? "history" : "requests"),
    summary: {
      total: sr?.total[0]?.count || 0,
      approved: sr?.approved[0]?.count || 0,
      pending: sr?.pending[0]?.count || 0
    },
    passes: listResult[0]?.data || [],
    pagination: {
      page,
      limit,
      totalRecords,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    }
  };
};

export const reassignActivePasses = async (studentId, oldHostelId, newHostelId, actor, session) => {
  if (!studentId || !newHostelId) {
    throw new Error("Student ID and destination hostel ID are required.");
  }

  // Find all active passes for this student that aren't already assigned to the new hostel (idempotence)
  const activePasses = await Pass.find({
    studentId,
    status: { $in: ["pending_parent", "pending_admin", "approved"] },
    hostelId: { $ne: newHostelId }
  }).session(session);

  if (activePasses.length === 0) {
    return {
      updatedCount: 0,
      skippedCount: 0,
      updatedPassIds: []
    };
  }

  const updatedPassIds = activePasses.map(p => p._id);

  // Construct bulkWrite operations
  const bulkOps = activePasses.map(pass => ({
    updateOne: {
      filter: { _id: pass._id },
      update: {
        $set: { hostelId: newHostelId },
        $push: {
          timeline: {
            action: "hostel_transferred",
            actorId: actor._id || actor.id,
            actorRole: actor.role || "system",
            oldHostelId: pass.hostelId || oldHostelId,
            newHostelId,
            remarks: "Pass responsibility transferred after hostel transfer."
          }
        }
      }
    }
  }));

  await Pass.bulkWrite(bulkOps, { session });

  return {
    updatedCount: updatedPassIds.length,
    skippedCount: 0,
    updatedPassIds
  };
};
