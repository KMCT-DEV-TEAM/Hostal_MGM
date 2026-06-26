import { getPaginatedLogsDb } from "./log.service.js";
import { sendSuccess, sendError } from "../../utils/response.js";
import asyncHandler from "../../utils/asyncHandler.js";

export const getLogs = asyncHandler(async (req, res) => {
    // Only super_admins can fetch all logs
    if (req.user.role !== 'super_admin') {
        return sendError(res, 403, "Access denied: Only Super Admin can view system logs");
    }

    const page = parseInt(req.query.page) || 1;
    const limit = req.query.limit !== undefined ? parseInt(req.query.limit) : 10;
    const search = req.query.search || "";
    const status = req.query.status || "All";
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    const { logs, totalCount } = await getPaginatedLogsDb(page, limit, search, status, startDate, endDate);

    return sendSuccess(res, 200, "Logs fetched successfully", { 
      count: logs.length, 
      totalCount,
      currentPage: page,
      totalPages: limit > 0 ? Math.ceil(totalCount / limit) : 1,
      logs 
    });
});
