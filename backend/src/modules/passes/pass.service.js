import Pass from "./pass.model.js";

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
