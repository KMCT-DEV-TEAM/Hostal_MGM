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

// --- Helpers ---

// Date filter helper is moved to aggregation.js but kept here for backward compatibility for non-management services
const applyDateRangeFilter = (filter, field, startDate, endDate) => {
  buildDateRangeFilter(filter, field, startDate, endDate);
};

export const createPassDb = async (passData) => {
  return await Pass.create(passData);
};

export const getStudentPassesDb = async (studentId, query) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter = { studentId: new mongoose.Types.ObjectId(studentId) };

  if (query.status) filter.status = query.status;
  if (query.passType) filter.passType = query.passType;
  if (query.outTime) filter.outTime = query.outTime;
  if (query.outPassCategory) filter.outPassCategory = query.outPassCategory;

  applyDateRangeFilter(filter, "fromDate", query.fromDate, query.toDate);

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
              outTime: 1,
              expectedReturnTime: 1,
              createdAt: 1,
              returnTracking: { returnStatus: 1 },
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

export const updatePassDb = async (passId, updateData) => {
  return await Pass.findByIdAndUpdate(passId, updateData, { new: true, runValidators: true });
};

export const addTimelineEventDb = async (passId, timelineEvent) => {
  return await Pass.findByIdAndUpdate(
    passId,
    { $push: { timeline: timelineEvent } },
    { new: true }
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
  if (query.outPassCategory) filter.outPassCategory = query.outPassCategory;

  applyDateRangeFilter(filter, "createdAt", query.startDate, query.endDate);

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
              createdAt: 1,
              returnTracking: { returnStatus: 1 },
              studentName: "$studentInfo.name",
              admissionNumber: "$studentInfo.studentId",
              parentApprovalStatus: "$parentApproval.status",
              wardenApprovalStatus: "$wardenApproval.status"
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
    .populate("studentId", "name admissionNo roomNo")
    .populate("hostelId", "name")
    .lean();
};

export const updatePassApprovalDb = async (passId, parentId, action, remarks) => {
  const statusUpdate = action === "approve" ? "pending_warden" : "rejected";
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
    { new: true }
  ).populate("studentId", "name admissionNo roomNo");
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
        pending: [{ $match: { status: "pending_warden" } }, { $count: "count" }],
        approved: [{ $match: { status: "approved" } }, { $count: "count" }],
        rejected: [{ $match: { status: "rejected" } }, { $count: "count" }],
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
    pending: result.pending[0]?.count || 0,
    approved: result.approved[0]?.count || 0,
    rejected: result.rejected[0]?.count || 0,
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
  buildDateRangeFilter(filter, "createdAt", query.startDate, query.endDate);

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

  const searchMatch = buildSearchMatch(query.search, ["studentInfo.name", "studentInfo.admissionNo", "studentInfo.roomNo"]);
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
    returnTracking: { returnStatus: 1 },
    studentInfo: {
      _id: "$studentInfo._id",
      name: "$studentInfo.name",
      admissionNo: "$studentInfo.admissionNo",
      roomNo: "$studentInfo.roomNo"
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

// --- Management Scope Services (Admin & Super Admin) ---

export const getManagementDashboardStatsDb = async (scope) => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  let matchQuery = {};
  if (scope.organizationId) {
    const hostels = await Hostel.find({ organizationId: new mongoose.Types.ObjectId(scope.organizationId), isActive: true }).select('_id').lean();
    matchQuery = { hostelId: { $in: hostels.map(h => h._id) } };
  }

  const [orgCount, hostelCount, studentCount, passStats] = await Promise.all([
    scope.role === "superadmin" ? Organization.countDocuments({ isActive: true }) : Promise.resolve(0),
    scope.role === "superadmin" ? Hostel.countDocuments({ isActive: true }) : Promise.resolve(0),
    scope.role === "superadmin" ? Student.countDocuments({ isActive: true }) : Promise.resolve(0),
    Pass.aggregate([
      { $match: matchQuery },
      buildDashboardStatsFacet(startOfToday, endOfToday)
    ])
  ]);

  const response = parseDashboardStatsFacet(passStats);

  if (scope.role === "superadmin") {
    response.totalOrganizations = orgCount;
    response.totalHostels = hostelCount;
    response.totalStudents = studentCount;
  }

  return response;
};

export const getManagementHostelsDb = async (scope) => {
  const matchQuery = { isActive: true };
  if (scope.organizationId) {
    matchQuery.organizationId = new mongoose.Types.ObjectId(scope.organizationId);
  }

  const pipeline = [
    { $match: matchQuery },
    {
      $lookup: {
        from: "organizations",
        localField: "organizationId",
        foreignField: "_id",
        as: "orgInfo"
      }
    },
    { $unwind: { path: "$orgInfo", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "users",
        localField: "warden",
        foreignField: "_id",
        as: "wardenInfo"
      }
    },
    { $unwind: { path: "$wardenInfo", preserveNullAndEmptyArrays: true } },
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
          { $match: { $expr: { $eq: ["$hostelId", "$$hostelId"] } } },
          {
            $group: {
              _id: null,
              totalCount: { $sum: 1 },
              pendingCount: {
                $sum: { $cond: [{ $in: ["$status", ["pending_parent", "pending_warden"]] }, 1, 0] }
              },
              approvedCount: {
                $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] }
              },
              rejectedCount: {
                $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] }
              },
              outsideCount: {
                $sum: { $cond: [{ $and: [{ $eq: ["$status", "approved"] }, { $eq: ["$returnTracking.returnStatus", "left"] }] }, 1, 0] }
              }
            }
          }
        ],
        as: "passStats"
      }
    }
  ];

  if (scope.role === "superadmin") {
    pipeline.push({
      $project: {
        _id: 1,
        organization: "$orgInfo.name",
        hostel: "$name",
        students: { $arrayElemAt: ["$studentsInfo.studentCount", 0] },
        leaves: { $arrayElemAt: ["$passStats.totalCount", 0] },
        pending: { $arrayElemAt: ["$passStats.pendingCount", 0] },
        approved: { $arrayElemAt: ["$passStats.approvedCount", 0] },
        rejected: { $arrayElemAt: ["$passStats.rejectedCount", 0] },
        outside: { $arrayElemAt: ["$passStats.outsideCount", 0] }
      }
    });
  } else {
    pipeline.push({
      $project: {
        _id: 1,
        name: 1,
        warden: "$wardenInfo.name",
        students: { $arrayElemAt: ["$studentsInfo.studentCount", 0] },
        pending: { $arrayElemAt: ["$passStats.pendingCount", 0] },
        approved: { $arrayElemAt: ["$passStats.approvedCount", 0] },
        rejected: { $arrayElemAt: ["$passStats.rejectedCount", 0] },
        outside: { $arrayElemAt: ["$passStats.outsideCount", 0] }
      }
    });
  }

  pipeline.push(
    {
      $addFields: {
        students: { $ifNull: ["$students", 0] },
        leaves: { $ifNull: ["$leaves", 0] },
        pending: { $ifNull: ["$pending", 0] },
        approved: { $ifNull: ["$approved", 0] },
        rejected: { $ifNull: ["$rejected", 0] },
        outside: { $ifNull: ["$outside", 0] },
      }
    },
    { $sort: scope.role === "superadmin" ? { organization: 1, hostel: 1 } : { name: 1 } }
  );

  return await Hostel.aggregate(pipeline);
};

export const getManagementPassesDb = async (hostelId, query, scope) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter = { hostelId: new mongoose.Types.ObjectId(hostelId), ...buildStatusFilter(query) };
  buildDateRangeFilter(filter, "createdAt", query.startDate, query.endDate);

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

  const searchMatch = buildSearchMatch(query.search, ["studentInfo.name", "studentInfo.admissionNo", "studentInfo.roomNo"]);
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
    returnTracking: { returnStatus: 1 },
    studentInfo: {
      _id: "$studentInfo._id",
      name: "$studentInfo.name",
      admissionNo: "$studentInfo.admissionNo",
      roomNo: "$studentInfo.roomNo"
    }
  };

  pipeline.push(
    { $sort: { createdAt: -1 } },
    buildPaginationFacet(skip, limit, projectStage)
  );

  const stats = await Pass.aggregate(pipeline);
  return formatPaginationResponse(stats, page, limit);
};

export const getManagementPassDetailsDb = async (passId) => {
  return await Pass.findById(passId)
    .populate("studentId", "name admissionNo course department roomNo")
    .populate("parentId", "parentName phone relationship")
    .populate("hostelId", "name")
    .lean();
};

export const managementCancelPassDb = async (passId, reason, scope) => {
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

  return await Pass.findOneAndUpdate(filter, updateQuery, { new: true });
};

export const getWardenPassDetailsDb = async (passId, hostelId) => {
  return await Pass.findOne({ _id: passId, hostelId })
    .populate("studentId", "name admissionNo course department batch roomNo")
    .populate("parentId", "parentName phone relationship")
    .populate("hostelId", "name")
    .populate("wardenApproval.actionBy", "name")
    .lean();
};

export const updateWardenPassWorkflowDb = async (passId, hostelId, updateQuery) => {
  return await Pass.findOneAndUpdate(
    { _id: passId, hostelId },
    updateQuery,
    { new: true }
  ).populate("studentId", "name admissionNo");
};
