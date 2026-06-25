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
