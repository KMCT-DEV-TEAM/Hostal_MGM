export const validateCreateAssignment = (req, res, next) => {
  const { mentorId, batchId, remarks } = req.body;

  if (!mentorId || !batchId) {
    return res.status(400).json({
      success: false,
      message: "mentorId and batchId are required",
    });
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(mentorId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid mentorId",
    });
  }

  if (!uuidRegex.test(batchId)) {
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

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(id)) {
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

  if (!uuidRegex.test(newMentorId)) {
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

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(id)) {
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

  if (status && !["completed", "cancelled"].includes(status.toLowerCase())) {
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

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Assignment ID",
    });
  }

  next();
};

export const validateReleaseAssignment = (req, res, next) => {
  const { reason, status } = req.body || {};
  const { id } = req.params;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Assignment ID",
    });
  }

  if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: "A valid release reason is required",
    });
  }

  if (reason.trim().length > 500) {
    return res.status(400).json({
      success: false,
      message: "Reason cannot exceed 500 characters",
    });
  }

  if (status && !["completed", "cancelled"].includes(status.toLowerCase())) {
    return res.status(400).json({
      success: false,
      message: "Status can only be completed or cancelled",
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
