import mongoose from "mongoose";

export const validateCreateAssignment = (req, res, next) => {
  const { mentorId, batchId, remarks } = req.body;

  if (!mentorId || !batchId) {
    return res.status(400).json({
      success: false,
      message: "mentorId and batchId are required",
    });
  }

  if (!mongoose.Types.ObjectId.isValid(mentorId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid mentorId",
    });
  }

  if (!mongoose.Types.ObjectId.isValid(batchId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid batchId",
    });
  }

  if (remarks && remarks.length > 500) {
    return res.status(400).json({
      success: false,
      message: "Remarks cannot exceed 500 characters",
    });
  }

  next();
};

export const validateTransferMentor = (req, res, next) => {
  const { newMentorId, remarks } = req.body;
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Assignment ID in parameter",
    });
  }

  if (!newMentorId) {
    return res.status(400).json({
      success: false,
      message: "newMentorId is required",
    });
  }

  if (!mongoose.Types.ObjectId.isValid(newMentorId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid newMentorId",
    });
  }

  if (remarks && remarks.length > 500) {
    return res.status(400).json({
      success: false,
      message: "Remarks cannot exceed 500 characters",
    });
  }

  next();
};

export const validateUpdateAssignment = (req, res, next) => {
  const { remarks, status } = req.body;
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Assignment ID",
    });
  }

  if (remarks === undefined && status === undefined) {
    return res.status(400).json({
      success: false,
      message: "At least one of 'remarks' or 'status' must be provided for update",
    });
  }

  if (status && !["completed", "cancelled"].includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Status can only be updated to completed or cancelled",
    });
  }

  if (remarks && remarks.length > 500) {
    return res.status(400).json({
      success: false,
      message: "Remarks cannot exceed 500 characters",
    });
  }

  next();
};

export const validateAssignmentIdParam = (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Assignment ID",
    });
  }

  next();
};

export const validateAssignmentPagination = (req, res, next) => {
  const { page, limit } = req.query;

  if (page && (isNaN(page) || parseInt(page, 10) < 1)) {
    return res.status(400).json({
      success: false,
      message: "Page must be a positive integer",
    });
  }

  if (limit && (isNaN(limit) || parseInt(limit, 10) < 1)) {
    return res.status(400).json({
      success: false,
      message: "Limit must be a positive integer",
    });
  }

  next();
};
