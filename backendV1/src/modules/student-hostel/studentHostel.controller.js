

import asyncHandler from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/response.js";
import { updateStudentHostelService } from "./studentHostel.service.js";

// TODO: MIGRATION - When logs module is migrated to Prisma, ensure createLogDb works correctly.
import { createLogDb } from "../logs/log.service.js";


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
      ? `Student assigned to hostel, room: ${result.student.roomNumber || "N/A"}`
      : `Student transferred to hostel, room: ${result.student.roomNumber || "N/A"}`;

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
