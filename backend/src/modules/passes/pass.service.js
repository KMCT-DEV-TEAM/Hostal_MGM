import mongoose from "mongoose";
import Pass from "./pass.model.js";
import Parent from "../parents/parent.model.js";
import Hostel from "../hostels/hostel.model.js";

// --- Helpers ---

const applyDateRangeFilter = (filter, field, startDate, endDate) => {
  if (startDate || endDate) {
    filter[field] = {};
    if (startDate) filter[field].$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setUTCHours(23, 59, 59, 999);
      filter[field].$lte = end;
    }
  }
};

export const createPassDb = async (passData) => {
  return await Pass.create(passData);
};

export const getStudentPassesDb = async (studentId, query) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter = { studentId };

  if (query.status) filter.status = query.status;
  if (query.passType) filter.passType = query.passType;
  if (query.outTime) filter.outTime = query.outTime;

  applyDateRangeFilter(filter, "fromDate", query.fromDate, query.toDate);

  if (query.date) {
    const searchDate = new Date(query.date);
    searchDate.setUTCHours(0, 0, 0, 0);
    const endSearchDate = new Date(query.date);
    endSearchDate.setUTCHours(23, 59, 59, 999);
    filter.date = { $gte: searchDate, $lte: endSearchDate };
  }

  const [passes, totalRecords] = await Promise.all([
    Pass.find(filter)
      .select("passType status reason fromDate toDate date createdAt returnTracking.returnStatus")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("parentId", "parentName")
      .populate("hostelId", "name")
      .lean(),
    Pass.countDocuments(filter)
  ]);

  const totalPages = Math.ceil(totalRecords / limit);

  return {
    passes,
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
  
  const filter = { studentId };
  
  if (query.status) filter.status = query.status;
  if (query.passType) filter.passType = query.passType;
  
  applyDateRangeFilter(filter, "createdAt", query.startDate, query.endDate);

  const [passes, totalRecords] = await Promise.all([
    Pass.find(filter)
      .select("passType status reason fromDate toDate date createdAt returnTracking.returnStatus")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("hostelId", "name")
      .lean(),
    Pass.countDocuments(filter)
  ]);

  const totalPages = Math.ceil(totalRecords / limit);

  return {
    passes,
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
    todayRequests: result.todayRequests[0]?.count || 0,
    todayReturns: result.todayReturns[0]?.count || 0
  };
};

export const getWardenPassesDb = async (hostelId, query) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const skip = (page - 1) * limit;
  
  const filter = { hostelId };

  if (query.status) filter.status = query.status;
  if (query.passType) filter.passType = query.passType;
  if (query.returnStatus) filter["returnTracking.returnStatus"] = query.returnStatus;
  
  applyDateRangeFilter(filter, "createdAt", query.startDate, query.endDate);

  let studentMatch = null;
  if (query.search) {
    const searchRegex = new RegExp(query.search, "i");
    studentMatch = {
      $or: [
        { name: searchRegex },
        { admissionNo: searchRegex },
        { roomNo: searchRegex }
      ]
    };
  }

  const queryChain = Pass.find(filter)
    .select("passType status reason fromDate toDate date createdAt returnTracking.returnStatus")
    .sort({ createdAt: -1 })
    .populate({
      path: "studentId",
      select: "name admissionNo roomNo",
      match: studentMatch
    })
    .populate("parentId", "parentName");

  let passesPromise, countPromise;

  if (studentMatch) {
    passesPromise = queryChain.lean();
    countPromise = Promise.resolve(null); 
  } else {
    passesPromise = queryChain.skip(skip).limit(limit).lean();
    countPromise = Pass.countDocuments(filter);
  }

  const [fetchedPasses, dbCount] = await Promise.all([passesPromise, countPromise]);

  let finalPasses = fetchedPasses;
  let totalRecords = dbCount;

  if (studentMatch) {
    finalPasses = fetchedPasses.filter(p => p.studentId !== null);
    totalRecords = finalPasses.length;
    finalPasses = finalPasses.slice(skip, skip + limit);
  }

  const passesResult = finalPasses.map(p => ({
    _id: p._id,
    studentInfo: p.studentId,
    parentInfo: p.parentId,
    passType: p.passType,
    status: p.status,
    returnTracking: { returnStatus: p.returnTracking?.returnStatus },
    createdAt: p.createdAt,
    fromDate: p.fromDate,
    toDate: p.toDate,
    date: p.date
  }));

  const totalPages = Math.ceil(totalRecords / limit);

  return {
    passes: passesResult,
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
