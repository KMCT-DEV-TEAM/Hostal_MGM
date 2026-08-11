import asyncHandler from "../../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../../utils/response.js";
import {
  updateStudentHostelService,
  vacateHostelService,
} from "./studentHostel.service.js";
import {
  getHostelHistoryAggregate,
  getStudentHostelTimelineDb,
} from "./studentHostel.aggregate.js";
import { getIo } from "../../config/socket.js";
import { orchestratorService } from "../notifications/services/orchestrator.service.js";
import { createLogDb } from "../logs/log.service.js";

export const updateStudentHostel = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const result = await updateStudentHostelService(studentId, req.body, req.user);

  const eventName = result.action === "allocated" ? "HOSTEL_ALLOCATED" : "HOSTEL_CHANGED";
  const studentName = result.student.name || `${result.student.firstName || ''} ${result.student.lastName || ''}`.trim();

  await createLogDb({
    action: result.action === "allocated" ? "Assigned Student to Hostel" : "Transferred Student to Hostel",
    entityType: "StudentHostel",
    entityId: result.student._id,
    user: req.user.id || req.user._id,
    userRole: req.user.role,
    details: result.action === "allocated"
      ? `Student assigned to hostel, room: ${result.student.roomNumber || 'N/A'}`
      : `Student transferred to hostel, room: ${result.student.roomNumber || 'N/A'}`,
    status: "success"
  });

  return sendSuccess(
    res,
    result.action === "allocated" ? 201 : 200,
    result.action === "allocated"
      ? "Student allocated successfully"
      : "Student hostel changed successfully",
    result
  );
});

export const vacateHostel = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const result = await vacateHostelService(studentId, req.body, req.user);

  getIo()?.emit("studentHostelUpdated", {
    action: "vacated",
    studentId: result.student._id,
    oldHostelId: result.oldHostelId,
  });

  const studentName = result.student.name || `${result.student.firstName || ''} ${result.student.lastName || ''}`.trim();

  await createLogDb({
    action: "Vacated Student from Hostel",
    entityType: "StudentHostel",
    entityId: result.student._id,
    user: req.user.id || req.user._id,
    userRole: req.user.role,
    details: `Student vacated from hostel`,
    status: "success"
  });

  return sendSuccess(res, 200, "Student vacated from hostel successfully", result);
});

export const getHostelHistory = asyncHandler(async (req, res) => {
  let { organizationId } = req.query;

  // If the user is an admin, they can only view history for their own organization
  if (req.user.role === "admin") {
    organizationId = req.user.organization;
  }

  const query = { ...req.query, organizationId };
  const result = await getHostelHistoryAggregate(query);

  return sendSuccess(res, 200, "Hostel history fetched successfully", result);
});

export const getStudentHostelTimeline = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const result = await getStudentHostelTimelineDb(studentId);

  return sendSuccess(res, 200, "Student hostel timeline fetched successfully", { timeline: result });
});
