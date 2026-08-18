/**
 * studentHostel.validation.js
 *
 * PURPOSE:
 *   Request validation middleware — runs BEFORE the controller.
 *   Validates shape and format of incoming data.
 *   Returns HTTP 400 immediately on any failure.
 *
 * VALIDATES:
 *   - studentId  : present in req.params, must be a valid UUID v4
 *   - hostelId   : present in req.body, must be a valid UUID v4
 *   - roomNumber : present in req.body, must be a non-empty string
 *
 * DOES NOT validate:
 *   - Whether student/hostel actually exist  → service layer
 *   - Whether student is active              → service layer
 *   - Whether hostel is active               → service layer
 *   - Whether student is already allocated   → service layer
 *
 * UUID PATTERN:
 *   This project uses PostgreSQL UUID primary keys (not MongoDB ObjectIds).
 *   The regex below matches the standard UUID v4 format.
 */

import { isUUID } from "../../utils/validators.js";

// Standard UUID v4 regex — matches xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx

/**
 * validateAllocateStudentHostel
 *
 * Validates the request for: PATCH /student-hostels/:studentId
 *
 * Required:
 *   - params.studentId  → valid UUID
 *   - body.hostelId     → valid UUID
 *   - body.roomNumber   → non-empty string
 *
 * Optional (pass-through, no format checks):
 *   - body.reason
 *   - body.remarks
 *   - body.joinedAt     → if provided, must be parseable as a date
 */
export const validateAllocateStudentHostel = (req, res, next) => {
  const { studentId } = req.params;
  const { hostelId, roomNumber, joinedAt } = req.body;
  console.log("enter validation", studentId);
  // ------------------------------------------------------------------
  // 1. studentId — required UUID in route param
  // ------------------------------------------------------------------
  if (!studentId || !isUUID(studentId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid or missing studentId — must be a valid UUID",
    });
  }

  // ------------------------------------------------------------------
  // 2. hostelId — required UUID in request body
  // ------------------------------------------------------------------
  if (!hostelId) {
    return res.status(400).json({
      success: false,
      message: "hostelId is required",
    });
  }

  if (!isUUID(hostelId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid hostelId format — must be a valid UUID",
    });
  }

  // ------------------------------------------------------------------
  // 3. roomNumber — required, non-empty string
  // ------------------------------------------------------------------
  if (!roomNumber) {
    return res.status(400).json({
      success: false,
      message: "roomNumber is required",
    });
  }

  if (typeof roomNumber !== "string" || roomNumber.trim() === "") {
    return res.status(400).json({
      success: false,
      message: "roomNumber must be a non-empty string",
    });
  }

  // ------------------------------------------------------------------
  // 4. joinedAt — optional, but must be a valid date if provided
  // ------------------------------------------------------------------
  if (joinedAt !== undefined && joinedAt !== null && joinedAt !== "") {
    const parsed = new Date(joinedAt);
    if (isNaN(parsed.getTime())) {
      return res.status(400).json({
        success: false,
        message: "joinedAt must be a valid ISO 8601 date string",
      });
    }
  }

  next();
};
