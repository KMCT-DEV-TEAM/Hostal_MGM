
import { prisma } from "../../config/prisma.js";
import { isUUID } from "../../utils/validators.js";

export const validateCreatePass = async (req, res, next) => {
  try {
    const {
      passType,
      reason,
      fromDate,
      toDate,
      totalDays,
      date,
      outTime,
      expectedReturnTime,
      outPassCategory
    } = req.body;

    const studentId = req.user.id;

    if (!passType || !["home_pass", "out_pass"].includes(passType)) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid pass type (Home Pass or Out Pass).",
      });
    }

    if (!reason || reason.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Please provide a reason for your leave.",
      });
    }

    if (passType === "home_pass") {
      if (!fromDate || !toDate || totalDays === undefined) {
        return res.status(400).json({
          success: false,
          message: "Please provide the start date, end date, and total days for your Home Pass.",
        });
      }

      const start = new Date(fromDate);
      const end = new Date(toDate);
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      // 1. From Date Cannot Be Past
      if (start < today) {
        return res.status(400).json({
          success: false,
          message: "The start date cannot be in the past. Please select a valid date.",
        });
      }

      // 2. To Date Must Be After From Date
      if (end < start) {
        return res.status(400).json({
          success: false,
          message: "The end date must be after or the same as the start date.",
        });
      }

      // 3. Maximum Leave Days
      const maxLeaveDays = 30; // Defined limit
      if (totalDays > maxLeaveDays) {
        return res.status(400).json({
          success: false,
          message: `You cannot request leave for more than ${maxLeaveDays} days.`,
        });
      }

      // 4. No Overlapping Home Pass
      const overlappingPass = await prisma.pass.findFirst({
        where: {
          studentId,
          passType: "home_pass",
          status: { notIn: ["rejected", "cancelled", "completed"] },
          fromDate: { lte: end },
          toDate: { gte: start },
        },
      });

      if (overlappingPass) {
        return res.status(400).json({
          success: false,
          message: "You already have another home pass requested or approved during these dates.",
        });
      }
    }

    if (passType === "out_pass") {
      if (!date || !outTime || !expectedReturnTime || !outPassCategory) {
        return res.status(400).json({
          success: false,
          message: "Please provide the date, departure time, expected return time, and out pass category for your Out Pass.",
        });
      }

      if (!["in_house", "out_house"].includes(outPassCategory)) {
        return res.status(400).json({
          success: false,
          message: "Out Pass category must be either in_house or out_house.",
        });
      }

      const passDate = new Date(date);
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      if (passDate < today) {
        return res.status(400).json({
          success: false,
          message: "The date cannot be in the past. Please select a valid date.",
        });
      }

      if (expectedReturnTime <= outTime) {
        return res.status(400).json({
          success: false,
          message: "The expected return time must be later than the departure time.",
        });
      }

      const [outHour, outMinute] = outTime.split(":").map(Number);
      const [returnHour, returnMinute] = expectedReturnTime.split(":").map(Number);

      const outDateTime = new Date(passDate);
      outDateTime.setHours(outHour, outMinute, 0, 0);

      const returnDateTime = new Date(passDate);
      returnDateTime.setHours(returnHour, returnMinute, 0, 0);

      const durationInHours = (returnDateTime - outDateTime) / (1000 * 60 * 60);
      const MAX_OUT_PASS_HOURS = Number(process.env.MAX_OUT_PASS_HOURS) || 12;

      if (durationInHours > MAX_OUT_PASS_HOURS) {
        return res.status(400).json({
          success: false,
          message: `Out Pass cannot exceed ${MAX_OUT_PASS_HOURS} hours. Please apply for a Home Pass instead.`,
        });
      }

      const dayStart = new Date(passDate);
      dayStart.setUTCHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setUTCHours(23, 59, 59, 999);

      const existingOutPass = await prisma.pass.findFirst({
        where: {
          studentId,
          passType: "out_pass",
          status: { notIn: ["rejected", "cancelled", "completed"] },
          fromDate: {
            gte: dayStart,
            lte: dayEnd,
          },
        },
      });

      if (existingOutPass) {
        return res.status(400).json({
          success: false,
          message: "You already have an Out Pass requested or approved for this date.",
        });
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};


export const validateGetPasses = (req, res, next) => {
  const { page, limit, status, passType, category, fromDate, toDate } = req.query;

  if (page && isNaN(parseInt(page))) {
    return res.status(400).json({ success: false, message: "The page number must be valid." });
  }

  if (limit && isNaN(parseInt(limit))) {
    return res.status(400).json({ success: false, message: "The display limit must be a valid number." });
  }

  if (status && !["pending_parent", "pending_admin", "approved", "rejected", "cancelled", "returned", "completed"].includes(status)) {
    return res.status(400).json({ success: false, message: "The selected status filter is invalid." });
  }

  if (passType && !["home_pass", "out_pass"].includes(passType)) {
    return res.status(400).json({ success: false, message: "The selected pass type filter is invalid." });
  }

  if (category && !["in_house", "out_house"].includes(category)) {
    return res.status(400).json({ success: false, message: "The selected out pass category filter is invalid." });
  }

  if (fromDate) {
    const parsedDate = new Date(fromDate);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ success: false, message: "Invalid from date format. Please use YYYY-MM-DD." });
    }
  }

  if (toDate) {
    const parsedDate = new Date(toDate);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ success: false, message: "Invalid to date format. Please use YYYY-MM-DD." });
    }
  }

  if (fromDate && toDate) {
    const from = new Date(fromDate);
    const to = new Date(toDate);
    if (from > to) {
      return res.status(400).json({ success: false, message: "From date cannot be after to date." });
    }
  }

  next();
};


// ─── Unified Listing Validator ────────────────────────────────────────────────

export const validateGetPassesUnified = (req, res, next) => {
  const {
    mode,
    passType,
    status,
    category,
    outTime,
    returnTime,
    fromDate,
    toDate,
    sortBy,
    sortOrder,
    page,
    limit
  } = req.query;

  const VALID_STATUSES = [
    "pending_parent",
    "pending_admin",
    "approved",
    "rejected",
    "cancelled",
    "returned",
    "completed"
  ];

  const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

  if (mode && !["requests", "history"].includes(mode)) {
    return res.status(400).json({
      success: false,
      message: "Invalid mode. Use 'requests' for active passes or 'history' for past passes."
    });
  }

  if (passType && !["home_pass", "out_pass"].includes(passType)) {
    return res.status(400).json({
      success: false,
      message: "Invalid pass type. Use 'home_pass' or 'out_pass'."
    });
  }

  if (status && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status filter. Valid values: ${VALID_STATUSES.join(", ")}.`
    });
  }

  if (category && !["in_house", "out_house"].includes(category)) {
    return res.status(400).json({
      success: false,
      message: "Invalid category. Use 'in_house' or 'out_house'."
    });
  }

  if (outTime && !TIME_REGEX.test(outTime)) {
    return res.status(400).json({
      success: false,
      message: "Invalid outTime format. Use HH:MM (e.g. 09:30)."
    });
  }

  if (returnTime && !TIME_REGEX.test(returnTime)) {
    return res.status(400).json({
      success: false,
      message: "Invalid returnTime format. Use HH:MM (e.g. 18:00)."
    });
  }

  if (outTime && returnTime && returnTime <= outTime) {
    return res.status(400).json({
      success: false,
      message: "returnTime must be later than outTime."
    });
  }

  if (fromDate) {
    if (isNaN(new Date(fromDate).getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid fromDate format. Use YYYY-MM-DD."
      });
    }
  }

  if (toDate) {
    if (isNaN(new Date(toDate).getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid toDate format. Use YYYY-MM-DD."
      });
    }
  }

  if (fromDate && toDate && new Date(fromDate) > new Date(toDate)) {
    return res.status(400).json({
      success: false,
      message: "fromDate cannot be after toDate."
    });
  }

  if (sortBy && !["createdAt", "fromDate", "date"].includes(sortBy)) {
    return res.status(400).json({
      success: false,
      message: "Invalid sortBy. Use 'createdAt', 'fromDate', or 'date'."
    });
  }

  if (sortOrder && !["asc", "desc"].includes(sortOrder)) {
    return res.status(400).json({
      success: false,
      message: "Invalid sortOrder. Use 'asc' or 'desc'."
    });
  }

  if (page && (isNaN(parseInt(page)) || parseInt(page) < 1)) {
    return res.status(400).json({
      success: false,
      message: "Page must be a positive number."
    });
  }

  if (limit) {
    const parsedLimit = parseInt(limit);
    if (isNaN(parsedLimit) || parsedLimit < 1) {
      return res.status(400).json({
        success: false,
        message: "Limit must be a positive number."
      });
    }
    if (parsedLimit > 50) {
      return res.status(400).json({
        success: false,
        message: "Limit cannot exceed 50 records per page."
      });
    }
  }

  next();
};

export const validatePassIdParam = (req, res, next) => {
  const { id } = req.params;
  if (!id || !isUUID(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Pass ID format. Must be a valid UUID.",
    });
  }
  next();
};

export const validateUpdatePass = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = (req.user.role || "").toLowerCase();
    const {
      reason,
      fromDate,
      toDate,
      totalDays,
      date,
      outTime,
      expectedReturnTime,
      outPassCategory
    } = req.body;

    if (
      !reason &&
      !fromDate &&
      !toDate &&
      totalDays === undefined &&
      !date &&
      !outTime &&
      !expectedReturnTime &&
      !outPassCategory
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide at least one detail to update.",
      });
    }

    const existingPass = await prisma.pass.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            organizationId: true,
            batchId: true,
            studentParents: true,
          }
        }
      }
    });
    if (!existingPass) {
      return res.status(404).json({ success: false, message: "We couldn't find the pass you're looking for." });
    }

    // Role-based update permission check
    if (userRole === "student" && existingPass.studentId !== userId) {
      return res.status(403).json({ success: false, message: "You don't have permission to edit this pass." });
    }
    if (userRole === "parent") {
      const parentLink = existingPass.student?.studentParents?.some(sp => sp.parentId === userId);
      if (!parentLink) {
        return res.status(403).json({ success: false, message: "You don't have permission to edit this pass." });
      }
    }
    if (userRole !== "student" && userRole !== "parent") {
      return res.status(403).json({ success: false, message: "You don't have permission to edit this pass." });
    }

    // Check if student left the hostel
    const leftLog = await prisma.passGateLog.findFirst({
      where: {
        passId: id,
        eventType: "LEFT",
      },
    });
    if (leftLog) {
      return res.status(422).json({ success: false, message: "You cannot edit this pass because the student has already left the hostel." });
    }

    if (["cancelled", "rejected", "completed", "returned"].includes(existingPass.status)) {
      return res.status(422).json({ success: false, message: "You cannot edit this pass because of its current status." });
    }

    const passType = existingPass.passType;

    if (passType === "home_pass") {
      const newFromDate = fromDate || existingPass.fromDate;
      const newToDate = toDate || existingPass.toDate;

      const start = new Date(newFromDate);
      const end = new Date(newToDate);
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      if (fromDate && start < today) {
        return res.status(400).json({
          success: false,
          message: "The start date cannot be in the past. Please select a valid date.",
        });
      }

      if (end < start) {
        return res.status(400).json({
          success: false,
          message: "The end date must be after or the same as the start date.",
        });
      }

      if (fromDate || toDate) {
        const overlappingPass = await prisma.pass.findFirst({
          where: {
            id: { not: id },
            studentId: existingPass.studentId,
            passType: "home_pass",
            status: { notIn: ["rejected", "cancelled", "completed"] },
            fromDate: { lte: end },
            toDate: { gte: start },
          },
        });

        if (overlappingPass) {
          return res.status(400).json({
            success: false,
            message: "The updated dates overlap with another home pass you've already requested.",
          });
        }
      }
    }

    if (passType === "out_pass") {
      const existingDate = existingPass.fromDate;

      let existingOutTime = "";
      if (existingPass.fromDate) {
        const d = new Date(existingPass.fromDate);
        existingOutTime = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
      }

      let existingReturnTime = "";
      if (existingPass.expectedReturnAt) {
        const d = new Date(existingPass.expectedReturnAt);
        existingReturnTime = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
      }

      const newDate = date || existingDate;
      const newOutTime = outTime || existingOutTime;
      const newReturnTime = expectedReturnTime || existingReturnTime;

      if (!newDate || !newOutTime || !newReturnTime) {
        return res.status(400).json({
          success: false,
          message: "Please ensure the date, departure time, and expected return time are correctly filled for your Out Pass.",
        });
      }

      if (newReturnTime <= newOutTime) {
        return res.status(400).json({
          success: false,
          message: "The expected return time must be later than the departure time.",
        });
      }

      const updatedPassDate = new Date(newDate);
      const [outHour, outMinute] = newOutTime.split(":").map(Number);
      const [returnHour, returnMinute] = newReturnTime.split(":").map(Number);

      const outDateTime = new Date(updatedPassDate);
      outDateTime.setHours(outHour, outMinute, 0, 0);

      const returnDateTime = new Date(updatedPassDate);
      returnDateTime.setHours(returnHour, returnMinute, 0, 0);

      const durationInHours = (returnDateTime - outDateTime) / (1000 * 60 * 60);
      const MAX_OUT_PASS_HOURS = Number(process.env.MAX_OUT_PASS_HOURS) || 12;

      if (durationInHours > MAX_OUT_PASS_HOURS) {
        return res.status(400).json({
          success: false,
          message: `Out Pass cannot exceed ${MAX_OUT_PASS_HOURS} hours. Please apply for a Home Pass instead.`,
        });
      }

      const dayStart = new Date(updatedPassDate);
      dayStart.setUTCHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setUTCHours(23, 59, 59, 999);

      const existingOutPass = await prisma.pass.findFirst({
        where: {
          id: { not: id },
          studentId: existingPass.studentId,
          passType: "out_pass",
          status: { notIn: ["rejected", "cancelled", "completed"] },
          fromDate: {
            gte: dayStart,
            lte: dayEnd,
          },
        },
      });

      if (existingOutPass) {
        return res.status(400).json({
          success: false,
          message: "You already have another Out Pass requested or approved for this date.",
        });
      }

      if (outPassCategory) {
        if (!["in_house", "out_house"].includes(outPassCategory)) {
          return res.status(400).json({
            success: false,
            message: "Out Pass category must be either in_house or out_house.",
          });
        }
      }
    }

    req.pass = existingPass;
    next();
  } catch (error) {
    next(error);
  }
};

export const validateCancelPass = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const role = (req.user.role || "").toLowerCase();

    const existingPass = await prisma.pass.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            organizationId: true,
            batchId: true,
            studentParents: true,
          }
        }
      }
    });
    if (!existingPass) {
      return res.status(404).json({ success: false, message: "We couldn't find the pass you're looking for." });
    }

    // Role-specific cancellation checks
    if (role === "student" && existingPass.studentId !== userId) {
      return res.status(403).json({ success: false, message: "You do not have permission to cancel this pass." });
    }
    if (role === "parent") {
      const isLinked = existingPass.student?.studentParents?.some(sp => sp.parentId === userId);
      if (!isLinked) {
        return res.status(403).json({ success: false, message: "You do not have permission to cancel this pass." });
      }
    }
    if (role === "warden" || role === "assistant_warden") {
      const wardenLink = await prisma.hostelWarden.findFirst({
        where: {
          userId: userId,
          hostelId: existingPass.hostelId
        }
      });
      if (!wardenLink) {
        return res.status(403).json({ success: false, message: "You don't have permission to cancel passes for this hostel." });
      }
    }
    if (role === "mentor") {
      const activeAssignments = await prisma.mentorAssignment.findMany({
        where: {
          mentorId: userId,
          status: "ACTIVE"
        },
        select: { batchId: true }
      });
      const batchIds = activeAssignments.map(a => a.batchId);
      if (!existingPass.student?.batchId || !batchIds.includes(existingPass.student.batchId)) {
        return res.status(403).json({ success: false, message: "You don't have permission to cancel passes for this student." });
      }
    }
    if (role === "admin") {
      if (req.user.organizationId !== existingPass.organizationId) {
        return res.status(403).json({ success: false, message: "You don't have permission to cancel this pass." });
      }
    }

    if (["completed", "cancelled", "rejected", "returned"].includes(existingPass.status)) {
      return res.status(422).json({ success: false, message: "This pass can't be cancelled because of its current status." });
    }

    const leftLog = await prisma.passGateLog.findFirst({
      where: {
        passId: id,
        eventType: "LEFT"
      }
    });
    if (leftLog) {
      return res.status(422).json({ success: false, message: "You cannot cancel this pass because the student has already left the hostel." });
    }

    req.pass = existingPass;
    next();
  } catch (error) {
    next(error);
  }
};
