import Pass from "./pass.model.js";
import Parent from "../parents/parent.model.js";

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

  if (query.status) {
    filter.status = query.status;
  }

  if (query.passType) {
    filter.passType = query.passType;
  }

  // Filter by 'fromDate' and 'toDate' (typically for home_pass)
  if (query.fromDate || query.toDate) {
    filter.fromDate = {};
    if (query.fromDate) filter.fromDate.$gte = new Date(query.fromDate);
    if (query.toDate) filter.fromDate.$lte = new Date(query.toDate);
  }

  // Filter by specific 'date' (typically for out_pass)
  if (query.date) {
    const searchDate = new Date(query.date);
    searchDate.setUTCHours(0, 0, 0, 0);
    const endSearchDate = new Date(query.date);
    endSearchDate.setUTCHours(23, 59, 59, 999);
    filter.date = { $gte: searchDate, $lte: endSearchDate };
  }

  // Filter by outTime
  if (query.outTime) {
    filter.outTime = query.outTime;
  }

  const passes = await Pass.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("parentId", "parentName phone email")
    .populate("hostelId", "name")
    .lean();

  const totalRecords = await Pass.countDocuments(filter);

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
  const total = await Pass.countDocuments({ studentId });
  const pending = await Pass.countDocuments({ studentId, status: "pending_parent" });
  const approved = await Pass.countDocuments({ 
    studentId, 
    "parentApproval.status": "approved" 
  });
  const rejected = await Pass.countDocuments({ 
    studentId, 
    "parentApproval.status": "rejected" 
  });

  return { total, pending, approved, rejected };
};

export const getPassesDb = async (studentId, query) => {
  const { page = 1, limit = 10, status, passType, startDate, endDate } = query;
  
  const filter = { studentId };
  
  if (status) filter.status = status;
  if (passType) filter.passType = passType;
  
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setUTCHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const passes = await Pass.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate("hostelId", "name")
    .lean();

  const total = await Pass.countDocuments(filter);
  
  return {
    passes,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
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

  const updatedPass = await Pass.findOneAndUpdate(
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

  return updatedPass;
};

export const getParentDb = async (parentId) => {
  return await Parent.findById(parentId).lean();
};

// --- Warden Services ---
import Hostel from "../hostels/hostel.model.js";

export const getWardenHostelDb = async (wardenId) => {
  return await Hostel.findOne({ wardens: wardenId, isActive: true }).lean();
};

export const getWardenDashboardStatsDb = async (hostelId) => {
  const total = await Pass.countDocuments({ hostelId });
  const pending = await Pass.countDocuments({ hostelId, status: "pending_warden" });
  const approved = await Pass.countDocuments({ hostelId, status: "approved" });
  const rejected = await Pass.countDocuments({ hostelId, status: "rejected" });
  
  const studentsOutside = await Pass.countDocuments({ 
    hostelId, 
    "returnTracking.leftHostelAt": { $exists: true, $ne: null },
    "returnTracking.returnedAt": null
  });
  
  const returned = await Pass.countDocuments({ hostelId, status: "returned" });
  
  const homePassCount = await Pass.countDocuments({ hostelId, passType: "home_pass" });
  const outPassCount = await Pass.countDocuments({ hostelId, passType: "out_pass" });
  
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const endOfToday = new Date(today);
  endOfToday.setUTCHours(23, 59, 59, 999);
  
  const todayRequests = await Pass.countDocuments({
    hostelId,
    createdAt: { $gte: today, $lte: endOfToday }
  });
  
  const todayReturns = await Pass.countDocuments({
    hostelId,
    "returnTracking.returnedAt": { $gte: today, $lte: endOfToday }
  });

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
  const { page = 1, limit = 10, status, passType, search, returnStatus, startDate, endDate } = query;
  
  const pipeline = [
    { $match: { hostelId: hostelId } }
  ];

  if (status) pipeline.push({ $match: { status } });
  if (passType) pipeline.push({ $match: { passType } });
  if (returnStatus) pipeline.push({ $match: { "returnTracking.returnStatus": returnStatus } });
  
  if (startDate || endDate) {
    const dateMatch = {};
    if (startDate) dateMatch.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setUTCHours(23, 59, 59, 999);
      dateMatch.$lte = end;
    }
    pipeline.push({ $match: { createdAt: dateMatch } });
  }

  pipeline.push({
    $lookup: {
      from: "students",
      localField: "studentId",
      foreignField: "_id",
      as: "studentInfo"
    }
  });
  pipeline.push({ $unwind: "$studentInfo" });

  if (search) {
    const searchRegex = new RegExp(search, "i");
    pipeline.push({
      $match: {
        $or: [
          { "studentInfo.name": searchRegex },
          { "studentInfo.admissionNo": searchRegex },
          { "studentInfo.roomNo": searchRegex }
        ]
      }
    });
  }

  // Count total matching records before pagination
  const countPipeline = [...pipeline, { $count: "total" }];
  
  pipeline.push({ $sort: { createdAt: -1 } });
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  pipeline.push({ $skip: skip });
  pipeline.push({ $limit: parseInt(limit) });
  
  pipeline.push({
    $lookup: {
      from: "parents",
      localField: "parentId",
      foreignField: "_id",
      as: "parentInfo"
    }
  });
  pipeline.push({ $unwind: { path: "$parentInfo", preserveNullAndEmptyArrays: true } });

  pipeline.push({
    $project: {
      "studentInfo.name": 1,
      "studentInfo.admissionNo": 1,
      "studentInfo.roomNo": 1,
      "studentInfo.department": 1,
      "studentInfo.course": 1,
      "parentInfo.parentName": 1,
      "parentInfo.phone": 1,
      passType: 1,
      status: 1,
      "returnTracking.returnStatus": 1,
      createdAt: 1,
      fromDate: 1,
      toDate: 1,
      date: 1
    }
  });

  const [passesResult, countResult] = await Promise.all([
    Pass.aggregate(pipeline),
    Pass.aggregate(countPipeline)
  ]);

  const total = countResult.length > 0 ? countResult[0].total : 0;

  return {
    passes: passesResult,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
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
  // We include hostelId in filter to ensure atomic validation of hostel boundary
  return await Pass.findOneAndUpdate(
    { _id: passId, hostelId },
    updateQuery,
    { new: true }
  ).populate("studentId", "name admissionNo");
};
