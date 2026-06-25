import mongoose from "mongoose";
import Pass from "./pass.model.js";

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
      const overlappingPass = await Pass.findOne({
        studentId,
        passType: "home_pass",
        status: { $nin: ["rejected", "cancelled", "completed"] },
        fromDate: { $lte: end },
        toDate: { $gte: start },
      });

      if (overlappingPass) {
        return res.status(400).json({
          success: false,
          message: "You already have another home pass requested or approved during these dates.",
        });
      }
    }

    if (passType === "out_pass") {
      if (!date || !outTime || !expectedReturnTime) {
        return res.status(400).json({
          success: false,
          message: "Please provide the date, departure time, and expected return time for your Out Pass.",
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

      const existingOutPass = await Pass.findOne({
        studentId,
        passType: "out_pass",
        status: { $nin: ["rejected", "cancelled", "completed"] },
        date: passDate,
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

export const validatePassIdParam = (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "The pass you are looking for is invalid or does not exist.",
    });
  }

  next();
};

export const validateUpdatePass = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role; // Assuming role is attached by authMiddleware
    const {
      reason,
      fromDate,
      toDate,
      totalDays,
      date,
      outTime,
      expectedReturnTime
    } = req.body;

    if (
      !reason &&
      !fromDate &&
      !toDate &&
      totalDays === undefined &&
      !date &&
      !outTime &&
      !expectedReturnTime
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide at least one detail to update.",
      });
    }

    const existingPass = await Pass.findById(id);
    if (!existingPass) {
      return res.status(404).json({ success: false, message: "We couldn't find the pass you're looking for." });
    }

    if (userRole === "student" && existingPass.studentId.toString() !== userId) {
      return res.status(403).json({ success: false, message: "You do not have permission to edit this pass." });
    }
    if (userRole === "parent" && existingPass.parentId.toString() !== userId) {
      return res.status(403).json({ success: false, message: "You do not have permission to edit this pass." });
    }

    const passType = existingPass.passType;

    if (passType === "home_pass") {
      const newFromDate = fromDate || existingPass.fromDate;
      const newToDate = toDate || existingPass.toDate;
      const newTotalDays = totalDays !== undefined ? totalDays : existingPass.totalDays;

      if (!newFromDate || !newToDate || newTotalDays === undefined) {
        return res.status(400).json({
          success: false,
          message: "Please ensure the start date, end date, and total days are correctly filled for your Home Pass.",
        });
      }

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

      // if (newTotalDays > maxLeaveDays) {
      //   return res.status(400).json({
      //     success: false,
      //     message: `You cannot request leave for more than ${maxLeaveDays} days.`,
      //   });
      // }

      if (fromDate || toDate) {
        const overlappingPass = await Pass.findOne({
          _id: { $ne: id },
          userId,
          passType: "home_pass",
          status: { $nin: ["rejected", "cancelled", "completed"] },
          fromDate: { $lte: end },
          toDate: { $gte: start },
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
      const newDate = date || existingPass.date;
      const newOutTime = outTime || existingPass.outTime;
      const newReturnTime = expectedReturnTime || existingPass.expectedReturnTime;

      if (!newDate || !newOutTime || !newReturnTime) {
        return res.status(400).json({
          success: false,
          message: "Please ensure the date, departure time, and expected return time are correctly filled for your Out Pass.",
        });
      }

      if (date) {
        const passDate = new Date(newDate);
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        if (passDate < today) {
          return res.status(400).json({
            success: false,
            message: "The date cannot be in the past. Please select a valid date.",
          });
        }
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

      if (date) {
        const existingOutPass = await Pass.findOne({
          _id: { $ne: id },
          studentId: existingPass.studentId,
          passType: "out_pass",
          status: { $nin: ["rejected", "cancelled", "completed"] },
          date: updatedPassDate,
        });

        if (existingOutPass) {
          return res.status(400).json({
            success: false,
            message: "You already have another Out Pass requested or approved for this date.",
          });
        }
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const validateCancelPass = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const existingPass = await Pass.findById(id);
    if (!existingPass) {
      return res.status(404).json({ success: false, message: "We couldn't find the pass you're looking for." });
    }

    if (userRole === "student" && existingPass.studentId.toString() !== userId) {
      return res.status(403).json({ success: false, message: "You do not have permission to cancel this pass." });
    }
    if (userRole === "parent" && existingPass.parentId.toString() !== userId) {
      return res.status(403).json({ success: false, message: "You do not have permission to cancel this pass." });
    }

    if (!["pending_parent", "pending_warden", "approved"].includes(existingPass.status)) {
      return res.status(400).json({ success: false, message: "This pass cannot be cancelled because it has already been processed or completed." });
    }

    // Pass is valid to cancel, attach to request to save DB calls in controller
    req.pass = existingPass;
    next();
  } catch (error) {
    next(error);
  }
};

export const validateGetPasses = (req, res, next) => {
  const { page, limit, status, passType } = req.query;

  if (page && isNaN(parseInt(page))) {
    return res.status(400).json({ success: false, message: "The page number must be valid." });
  }

  if (limit && isNaN(parseInt(limit))) {
    return res.status(400).json({ success: false, message: "The display limit must be a valid number." });
  }

  if (status && !["pending_parent", "pending_warden", "approved", "rejected", "cancelled", "returned", "completed"].includes(status)) {
    return res.status(400).json({ success: false, message: "The selected status filter is invalid." });
  }

  if (passType && !["home_pass", "out_pass"].includes(passType)) {
    return res.status(400).json({ success: false, message: "The selected pass type filter is invalid." });
  }

  next();
};

export const validateRejectPass = (req, res, next) => {
  const { remarks } = req.body;

  if (!remarks || remarks.trim() === "") {
    return res.status(400).json({ success: false, message: "Please provide a reason or remark for rejecting this pass." });
  }

  next();
};


