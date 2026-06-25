import Pass from "./pass.model.js";
import Parent from "../parents/parent.model.js";
import Hostel from "../hostels/hostel.model.js";

// --- Helpers ---

/**
 * Helper to apply date range filtering
 * @param {Object} filter - The Mongoose filter object
 * @param {String} field - The date field to filter on
 * @param {String} startDate - The start date string
 * @param {String} endDate - The end date string
 */
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

/**
 * Creates a new pass in the database.
 * @param {Object} passData - The pass details
 * @returns {Promise<Object>} The created pass
 */
export const createPassDb = async (passData) => {
  return await Pass.create(passData);
};

/**
 * Fetches passes for a specific student with pagination.
 * @param {String} studentId - The student's ID
 * @param {Object} query - Query parameters (page, limit, status)
 * @returns {Promise<Object>} Object containing passes and pagination info
 */
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
      .select("-timeline")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("parentId", "parentName phone email")
      .populate("hostelId", "name")
      .lean(),
    Pass.countDocuments(filter)
  ]);

  return {
    passes,
    pagination: {
      totalRecords,
      totalPages: Math.ceil(totalRecords / limit),
      page,
      limit,
    },
  };
};

/**
 * Gets a single pass by ID.
 * @param {String} passId - The pass ID
 * @returns {Promise<Object>} The pass document
 */
export const getPassByIdDb = async (passId) => {
  return await Pass.findById(passId);
};

/**
 * Updates a pass (only for pending statuses).
 * @param {String} passId - The pass ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} The updated pass
 */
export const updatePassDb = async (passId, updateData) => {
  return await Pass.findByIdAndUpdate(passId, updateData, { new: true, runValidators: true });
};

/**
 * Adds an event to the pass timeline.
 * @param {String} passId - The pass ID
 * @param {Object} timelineEvent - The event object to push
 * @returns {Promise<Object>} The updated pass
 */
export const addTimelineEventDb = async (passId, timelineEvent) => {
  return await Pass.findByIdAndUpdate(
    passId,
    { $push: { timeline: timelineEvent } },
    { new: true }
  );
};

export const getDashboardStatsDb = async (studentId) => {
  const [total, pending, approved, rejected] = await Promise.all([
    Pass.countDocuments({ studentId }),
    Pass.countDocuments({ studentId, status: "pending_parent" }),
    Pass.countDocuments({ studentId, "parentApproval.status": "approved" }),
    Pass.countDocuments({ studentId, "parentApproval.status": "rejected" })
  ]);

  return { total, pending, approved, rejected };
};

export const getPassesDb = async (studentId, query) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const skip = (page - 1) * limit;
  
  const filter = { studentId };
  
  if (query.status) filter.status = query.status;
  if (query.passType) filter.passType = query.passType;
  
  applyDateRangeFilter(filter, "createdAt", query.startDate, query.endDate);

  const [passes, total] = await Promise.all([
    Pass.find(filter)
      .select("-timeline")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("hostelId", "name")
      .lean(),
    Pass.countDocuments(filter)
  ]);

  return {
    passes,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

export const getPassDetailsDb = async (passId, studentId) => {
  return await Pass.findOne({ _id: passId, studentId })
    .populate("studentId", "name enrollmentNo roomNo")
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
  ).populate("studentId", "name enrollmentNo roomNo");
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

  const [
    total,
    pending,
    approved,
    rejected,
    studentsOutside,
    returned,
    homePassCount,
    outPassCount,
    todayRequests,
    todayReturns
  ] = await Promise.all([
    Pass.countDocuments({ hostelId }),
    Pass.countDocuments({ hostelId, status: "pending_warden" }),
    Pass.countDocuments({ hostelId, status: "approved" }),
    Pass.countDocuments({ hostelId, status: "rejected" }),
    Pass.countDocuments({ 
      hostelId, 
      "returnTracking.leftHostelAt": { $exists: true, $ne: null },
      "returnTracking.returnedAt": null
    }),
    Pass.countDocuments({ hostelId, status: "returned" }),
    Pass.countDocuments({ hostelId, passType: "home_pass" }),
    Pass.countDocuments({ hostelId, passType: "out_pass" }),
    Pass.countDocuments({
      hostelId,
      createdAt: { $gte: today, $lte: endOfToday }
    }),
    Pass.countDocuments({
      hostelId,
      "returnTracking.returnedAt": { $gte: today, $lte: endOfToday }
    })
  ]);

  return {
    total,
    pending,
    approved,
    rejected,
    studentsOutside,
    returned,
    homePassCount,
    outPassCount,
    todayRequests,
    todayReturns
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
    .select("-timeline")
    .sort({ createdAt: -1 })
    .populate({
      path: "studentId",
      select: "name admissionNo roomNo department course",
      match: studentMatch
    })
    .populate("parentId", "parentName phone");

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
  let total = dbCount;

  if (studentMatch) {
    finalPasses = fetchedPasses.filter(p => p.studentId !== null);
    total = finalPasses.length;
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
    date: p.date,
    activeAmendment: p.activeAmendment
  }));

  return {
    passes: passesResult,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
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
