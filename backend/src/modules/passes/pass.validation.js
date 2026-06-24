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
        message: "Valid passType is required (home_pass or out_pass)",
      });
    }

    if (!reason || reason.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Reason is required",
      });
    }

    if (passType === "home_pass") {
      if (!fromDate || !toDate || totalDays === undefined) {
        return res.status(400).json({
          success: false,
          message: "fromDate, toDate, and totalDays are required for home_pass",
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
          message: "fromDate cannot be in the past",
        });
      }

      // 2. To Date Must Be After From Date
      if (end < start) {
        return res.status(400).json({
          success: false,
          message: "toDate must be after or equal to fromDate",
        });
      }

      // 3. Maximum Leave Days
      const maxLeaveDays = 30; // Defined limit
      if (totalDays > maxLeaveDays) {
        return res.status(400).json({
          success: false,
          message: `Leave cannot exceed maximum of ${maxLeaveDays} days`,
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
          message: "You already have an overlapping home pass for these dates",
        });
      }
    }

    if (passType === "out_pass") {
      if (!date || !outTime || !expectedReturnTime) {
        return res.status(400).json({
          success: false,
          message: "date, outTime, and expectedReturnTime are required for out_pass",
        });
      }

      const passDate = new Date(date);
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      if (passDate < today) {
        return res.status(400).json({
          success: false,
          message: "date cannot be in the past",
        });
      }

      if (expectedReturnTime <= outTime) {
        return res.status(400).json({
          success: false,
          message: "expectedReturnTime must be greater than outTime",
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
      message: "Invalid Pass ID",
    });
  }

  next();
};

export const validateUpdatePass = async (req, res, next) => {
  try {
    const { id } = req.params;
    const studentId = req.user.id;
    const {
      reason,
      fromDate,
      toDate,
      totalDays,
      date,
      outTime,
      expectedReturnTime,
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
        message: "At least one field must be provided for update",
      });
    }

    const existingPass = await Pass.findById(id);
    if (!existingPass) {
      return res.status(404).json({ success: false, message: "Pass not found" });
    }

    const passType = existingPass.passType;

    if (passType === "home_pass") {
      const newFromDate = fromDate || existingPass.fromDate;
      const newToDate = toDate || existingPass.toDate;
      const newTotalDays = totalDays !== undefined ? totalDays : existingPass.totalDays;

      if (!newFromDate || !newToDate || newTotalDays === undefined) {
        return res.status(400).json({
          success: false,
          message: "fromDate, toDate, and totalDays must be valid for home_pass",
        });
      }

      const start = new Date(newFromDate);
      const end = new Date(newToDate);
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      if (fromDate && start < today) {
        return res.status(400).json({
          success: false,
          message: "fromDate cannot be in the past",
        });
      }

      if (end < start) {
        return res.status(400).json({
          success: false,
          message: "toDate must be after or equal to fromDate",
        });
      }

      // if (newTotalDays > maxLeaveDays) {
      //   return res.status(400).json({
      //     success: false,
      //     message: `Leave cannot exceed maximum of ${maxLeaveDays} days`,
      //   });
      // }

      if (fromDate || toDate) {
        const overlappingPass = await Pass.findOne({
          _id: { $ne: id },
          studentId,
          passType: "home_pass",
          status: { $nin: ["rejected", "cancelled", "completed"] },
          fromDate: { $lte: end },
          toDate: { $gte: start },
        });

        if (overlappingPass) {
          return res.status(400).json({
            success: false,
            message: "These updated dates overlap with another home pass",
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
          message: "date, outTime, and expectedReturnTime must be valid for out_pass",
        });
      }

      if (date) {
        const passDate = new Date(newDate);
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        if (passDate < today) {
          return res.status(400).json({
            success: false,
            message: "date cannot be in the past",
          });
        }
      }

      if (newReturnTime <= newOutTime) {
        return res.status(400).json({
          success: false,
          message: "expectedReturnTime must be greater than outTime",
        });
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
    const studentId = req.user.id;

    const existingPass = await Pass.findById(id);
    if (!existingPass) {
      return res.status(404).json({ success: false, message: "Pass not found" });
    }

    if (existingPass.studentId.toString() !== studentId) {
      return res.status(403).json({ success: false, message: "You do not have permission to cancel this pass" });
    }

    if (!["pending_parent", "pending_warden"].includes(existingPass.status)) {
      return res.status(400).json({ success: false, message: "Pass cannot be cancelled in its current status" });
    }

    // Pass is valid to cancel, attach to request to save DB calls in controller
    req.pass = existingPass;
    next();
  } catch (error) {
    next(error);
  }
};
