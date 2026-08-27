
import { prisma } from "../../config/prisma.js";

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

      const existingOutPass = await prisma.pass.findFirst({
        where: {
          studentId,
          passType: "out_pass",
          status: { notIn: ["rejected", "cancelled", "completed"] },
          date: passDate,
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
