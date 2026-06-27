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
