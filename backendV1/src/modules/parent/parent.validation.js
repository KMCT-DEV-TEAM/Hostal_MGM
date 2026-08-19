import { isUUID } from "../../utils/validators.js";

export const validateCreateParent = (req, res, next) => {
  const { studentId, parentName, phone, relationship, email } = req.body;

  if (!studentId) {
    return res.status(400).json({ success: false, message: "studentId is required" });
  }

  if (!parentName || !phone || !relationship || !email) {
    return res.status(400).json({
      success: false,
      message: "studentId, parentName, relationship, phone, and email are required",
    });
  }

  next();
};

export const validateParentIdParam = (req, res, next) => {
  const { id } = req.params;

  if (!isUUID(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Parent ID format",
    });
  }

  next();
};

export const validateUpdateParent = (req, res, next) => {
  const { parentName, email, phone, relationship, defaultGuardian } = req.body;

  if (!parentName && !email && !phone && !relationship && typeof defaultGuardian === "undefined") {
    return res.status(400).json({
      success: false,
      message: "At least one field must be provided for update",
    });
  }

  next();
};
