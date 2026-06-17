const validateCreateStudent = (req, res, next) => {
  const { 
    organizationId,
    name, 
    email, 
    phone, 
    parentName, 
    parentEmail, 
    parentPhone, 
    relationship 
  } = req.body;

  if (req.user?.role === "super_admin" && !organizationId) {
    return res.status(400).json({ success: false, message: "organizationId is required" });
  }

  if (organizationId && !mongoose.Types.ObjectId.isValid(organizationId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid organizationId",
    });
  }

  if (!name || !email || !phone) {
    return res.status(400).json({ success: false, message: "Student name, email, and phone are required" });
  }

  if (!parentName || !parentEmail || !parentPhone || !relationship) {
    return res.status(400).json({ success: false, message: "Parent name, email, number, and relationship are required" });
  }

  next();
};

import mongoose from "mongoose";

const validateStudentIdParam = (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Student ID",
    });
  }

  next();
};

const validateUpdateStudent = (req, res, next) => {
  const { name, email, phone, gender, dob, course, department, address, status } = req.body;

  if (!name && !email && !phone && !gender && !dob && !course && !department && !address && !status) {
    return res.status(400).json({
      success: false,
      message: "At least one field must be provided for update",
    });
  }

  next();
};

const validateUpdateStudentOrganization = (req, res, next) => {
  const { organizationId } = req.body;

  if (!organizationId) {
    return res.status(400).json({
      success: false,
      message: "organizationId is required",
    });
  }

  if (!mongoose.Types.ObjectId.isValid(organizationId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid organizationId",
    });
  }

  next();
};

export {
  validateCreateStudent,
  validateStudentIdParam,
  validateUpdateStudent,
  validateUpdateStudentOrganization
};
