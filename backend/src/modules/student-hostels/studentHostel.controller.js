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

export const updateStudentHostel = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const result = await updateStudentHostelService(studentId, req.body, req.user);

  const eventName = result.action === "allocated" ? "HOSTEL_ALLOCATED" : "HOSTEL_CHANGED";
  const studentName = result.student.name || `${result.student.firstName || ''} ${result.student.lastName || ''}`.trim();

  // Trigger notification for Student
  await orchestratorService.triggerNotification({
    sender: { id: req.user._id, role: req.user.role, name: req.user.name },
    eventName,
    target: { type: 'STUDENT', filter: { studentId: result.student._id } },
    data: { roomNumber: result.student.roomNumber, studentName },
    channels: ['in-app', 'push']
  }).catch(err => console.error("Notification Error (Student):", err));

  // Trigger notification for Parent
  await orchestratorService.triggerNotification({
    sender: { id: req.user._id, role: req.user.role, name: req.user.name },
    eventName,
    target: { type: 'PARENT', filter: { studentId: result.student._id } },
    data: { roomNumber: result.student.roomNumber, studentName },
    channels: ['in-app', 'push']
  }).catch(err => console.error("Notification Error (Parent):", err));

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

  // Trigger notification for Student
  await orchestratorService.triggerNotification({
    sender: { id: req.user._id, role: req.user.role, name: req.user.name },
    eventName: "HOSTEL_VACATED",
    target: { type: 'STUDENT', filter: { studentId: result.student._id } },
    data: { studentName },
    channels: ['in-app', 'push']
  }).catch(err => console.error("Notification Error (Student):", err));

  // Trigger notification for Parent
  await orchestratorService.triggerNotification({
    sender: { id: req.user._id, role: req.user.role, name: req.user.name },
    eventName: "HOSTEL_VACATED",
    target: { type: 'PARENT', filter: { studentId: result.student._id } },
    data: { studentName },
    channels: ['in-app', 'push']
  }).catch(err => console.error("Notification Error (Parent):", err));

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
