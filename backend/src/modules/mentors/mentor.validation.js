import mongoose from "mongoose";

export const validateCreateMentor = (req, res, next) => {
  const { name, email, phone } = req.body;

  if (!name || !email || !phone) {
    return res.status(400).json({
      success: false,
      message: "name, email, and phone are required",
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: "Invalid email format",
    });
  }

  next();
};

export const validateMentorIdParam = (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Mentor ID",
    });
  }

  next();
};

export const validateUpdateMentor = (req, res, next) => {
  const { name, phone, email, specialization, status, isActive } = req.body;

  if (
    name === undefined &&
    phone === undefined &&
    email === undefined &&
    specialization === undefined &&
    status === undefined &&
    isActive === undefined
  ) {
    return res.status(400).json({
      success: false,
      message: "At least one field must be provided for update",
    });
  }

  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }
  }

  next();
};

export const validateMentorPagination = (req, res, next) => {
  const { page, limit } = req.query;

  if (page && (isNaN(page) || parseInt(page) < 1)) {
    return res.status(400).json({
      success: false,
      message: "Page must be a positive integer",
    });
  }

  if (limit && (isNaN(limit) || parseInt(limit) < 1)) {
    return res.status(400).json({
      success: false,
      message: "Limit must be a positive integer",
    });
  }

  next();
};
