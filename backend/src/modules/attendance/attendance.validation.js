import mongoose from "mongoose";

export const validateWindowIdParam = (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid attendance window ID.",
    });
  }

  next();
};

export const validateScanQR = (req, res, next) => {
  const { qrToken } = req.body;

  if (!qrToken || qrToken.trim() === "") {
    return res.status(400).json({
      success: false,
      message: "QR Token is required.",
    });
  }

  next();
};

export const validateGetWindows = (req, res, next) => {
  const { page, limit, status } = req.query;

  if (page && isNaN(parseInt(page))) {
    return res.status(400).json({ success: false, message: "Page must be a valid number." });
  }

  if (limit && isNaN(parseInt(limit))) {
    return res.status(400).json({ success: false, message: "Limit must be a valid number." });
  }

  if (status && !["open", "completed"].includes(status)) {
    return res.status(400).json({ success: false, message: "Status must be 'open' or 'completed'." });
  }

  next();
};

export const validateHistoryQuery = (req, res, next) => {
  const { page, limit, status, from, to } = req.query;

  if (page && isNaN(parseInt(page))) {
    return res.status(400).json({ success: false, message: "Page must be a valid number." });
  }

  if (limit && isNaN(parseInt(limit))) {
    return res.status(400).json({ success: false, message: "Limit must be a valid number." });
  }

  if (status && !["present", "absent", "late", "excused"].includes(status.toLowerCase())) {
    return res.status(400).json({ success: false, message: "Invalid status." });
  }

  if (from && isNaN(Date.parse(from))) {
    return res.status(400).json({ success: false, message: "Invalid from date." });
  }

  if (to && isNaN(Date.parse(to))) {
    return res.status(400).json({ success: false, message: "Invalid to date." });
  }

  next();
};

export const validateCalendarQuery = (req, res, next) => {
  const { month, year } = req.query;
  if (!month || isNaN(parseInt(month)) || parseInt(month) < 1 || parseInt(month) > 12) {
    return res.status(400).json({ success: false, message: "Valid month (1-12) is required." });
  }

  if (!year || isNaN(parseInt(year))) {
    return res.status(400).json({ success: false, message: "Valid year is required." });
  }

  next();
};

export const validateDateParam = (req, res, next) => {
  const { date } = req.params;

  if (!date || isNaN(Date.parse(date))) {
    return res.status(400).json({ success: false, message: "Invalid date format." });
  }

  next();
};
