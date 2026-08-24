

import asyncHandler from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/response.js";
import { 
  updateStudentHostelService, 
  vacateHostelService, 
  getHostelHistoryService,
  getStudentHostelTimelineService
} from "./studentHostel.service.js";

// TODO: MIGRATION - When logs module is migrated to Prisma, ensure createLogDb works correctly.
import { createLogDb } from "../logs/log.service.js";

/**
 * Allocates or transfers a student to a hostel.
 */
export const updateStudentHostel = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const { hostelId, roomNumber, reason, remarks, joinedAt } = req.body;

  const result = await updateStudentHostelService(
    studentId,
    { hostelId, roomNumber, reason, remarks, joinedAt },
    req.user,
  );

  const actionLogDetails =
    result.action === "allocated"
      ? `Student assigned to hostel, room: ${result.roomNumber || "N/A"}`
      : `Student transferred to hostel, room: ${result.roomNumber || "N/A"}`;

  // Log activity
  try {
    await createLogDb({
      action:
        result.action === "allocated"
          ? "Assigned Student to Hostel"
          : "Transferred Student to Hostel",
      entityType: "StudentHostel",
      entityId: result.student.id || result.student._id,
      user: req.user.id || req.user._id,
      userRole: req.user.role,
      details: actionLogDetails,
      status: "success",
    });
  } catch (logErr) {
    console.error("[Activity Log Error]", logErr);
  }

  return sendSuccess(
    res,
    result.action === "allocated" ? 201 : 200,
    result.action === "allocated"
      ? "Student allocated successfully"
      : "Student hostel changed successfully",
    result,
  );
});
/**
 * Vacates a student from their current hostel.
 */
export const vacateHostel = asyncHandler(async (req, res) => {
  const { studentId } = req.params;

  const result = await vacateHostelService(studentId, req.body, req.user);



  try {
    await createLogDb({
      action: "Vacated Student from Hostel",
      entityType: "StudentHostel",
      entityId: result.student.id,
      user: req.user.id || req.user._id,
      userRole: req.user.role,
      details: "Student vacated from hostel",
      status: "success",
    });
  } catch (logErr) {
    console.error("[Activity Log Error]", logErr);
  }

  // Map response to match MongoDB structure
  const mappedResult = {
    ...result,
    student: {
      ...result.student,
      _id: result.student.id
    },
    oldAllocation: {
      ...result.oldAllocation,
      _id: result.oldAllocation.id
    }
  };

  return sendSuccess(res, 200, "Student vacated from hostel successfully", mappedResult);
});
/**
 * Fetches the paginated history of all hostel allocations.
 */
export const getHostelHistory = asyncHandler(async (req, res) => {
  let { organizationId } = req.query;

  // If the user is an admin, they can only view history for their own organization
  if (req.user.role === "admin") {
    organizationId = req.user.organization;
  }

  const query = { ...req.query, organizationId };
  const result = await getHostelHistoryService(query);

  // Formatting exactly as MongoDB output, mapping id properly.
  const formattedHistory = result.history.map(item => ({
    id: item.id,
    roomNumber: item.roomNumber,
    status: item.status,
    joinedAt: item.joinedAt,
    vacatedAt: item.vacatedAt,
    reason: item.reason,
    remarks: item.remarks,
    student: item.student ? {
      id: item.student.id,
      name: item.student.name,
      admissionNo: item.student.admissionNo,
      email: item.student.email
    } : null,
    hostel: item.hostel ? {
      id: item.hostel.id,
      name: item.hostel.name,
      code: item.hostel.code
    } : null,
    organization: item.organization ? {
      id: item.organization.id,
      name: item.organization.name,
      code: item.organization.code
    } : null,
    allocatedBy: item.allocatedBy ? {
      id: item.allocatedBy.id,
      name: item.allocatedBy.name
    } : null,
    vacatedBy: item.vacatedBy ? {
      id: item.vacatedBy.id,
      name: item.vacatedBy.name
    } : null
  }));

  const finalResult = {
    history: formattedHistory,
    pagination: result.pagination
  };

  return sendSuccess(res, 200, "Hostel history fetched successfully", finalResult);
});
/**
 * Fetches the complete allocation timeline for a specific student.
 */
export const getStudentHostelTimeline = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const result = await getStudentHostelTimelineService(studentId);

  // Formatting exactly as MongoDB output, mapping id properly.
  const formattedTimeline = result.map(item => ({
    id: item.id,
    studentId: item.studentId,
    roomNumber: item.roomNumber,
    status: item.status,
    joinedAt: item.joinedAt,
    vacatedAt: item.vacatedAt,
    reason: item.reason,
    remarks: item.remarks,
    hostel: item.hostel ? {
      id: item.hostel.id,
      name: item.hostel.name,
      code: item.hostel.code
    } : null,
    allocatedBy: item.allocatedBy ? {
      id: item.allocatedBy.id,
      name: item.allocatedBy.name
    } : null,
    vacatedBy: item.vacatedBy ? {
      id: item.vacatedBy.id,
      name: item.vacatedBy.name
    } : null
  }));

  return sendSuccess(res, 200, "Student hostel timeline fetched successfully", { timeline: formattedTimeline });
});
