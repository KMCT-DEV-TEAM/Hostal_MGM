import mongoose from "mongoose";

const validateCreateParent = (req, res, next) => {
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

const validateParentIdParam = (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Parent ID",
    });
  }

  next();
};

const validateUpdateParent = (req, res, next) => {

  console.log(req.body)
  const {  parentName, email, phone, relationship, address, defaultGuardian } = req.body;

  if ( !parentName && !email && !phone && !relationship && !address && typeof defaultGuardian === "undefined") {
    return res.status(400).json({
      success: false,
      message: "At least one field must be provided for update",
    });
  }

  next();
};

export {
  validateParentIdParam,
  validateUpdateParent,
  validateCreateParent
};
