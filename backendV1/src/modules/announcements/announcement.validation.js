import { isUUID } from "../../utils/validators.js";

export const validateCreateAnnouncement = (req, res, next) => {
  const { title, message } = req.body;

  if (!title || !message) {
    return res.status(400).json({ success: false, message: "Title and message are required" });
  }

  next();
};

export const validateAnnouncementIdParam = (req, res, next) => {
  const { id } = req.params;

  if (!isUUID(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Announcement ID format",
    });
  }

  next();
};

export const validateUpdateAnnouncement = (req, res, next) => {
  // Add specific update validations if needed
  next();
};
