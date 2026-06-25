import ActivityLog from "./log.model.js";

/**
 * Creates a new activity log entry
 * @param {Object} logData - Log details (action, entityType, entityId, user, userRole, details, status)
 * @returns {Promise<Object>} Created log
 */
export const createLogDb = async (logData) => {
  try {
    const log = await ActivityLog.create(logData);
    return log;
  } catch (error) {
    console.error("Error creating activity log:", error);
    // Don't throw to prevent interrupting the main operation
    return null;
  }
};

/**
 * Retrieves paginated activity logs with optional filtering
 */
export const getPaginatedLogsDb = async (page = 1, limit = 10, search = "", status = "All") => {
  const skip = (page - 1) * limit;

  let query = {};

  if (status && status.toLowerCase() !== "all") {
    query.status = status.toLowerCase();
  }

  if (search) {
    query.$or = [
      { action: { $regex: search, $options: "i" } },
      { details: { $regex: search, $options: "i" } },
      { entityType: { $regex: search, $options: "i" } },
    ];
  }

  // Find logs and populate user details
  const logs = await ActivityLog.find(query)
    .populate("user", "name email")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean(); // Lean for faster read operations

  const totalCount = await ActivityLog.countDocuments(query);

  return { logs, totalCount };
};
