const validateCreateStudent = (req, res, next) => {
  const { 
    organizationId,
    name, 
    email, 
    phone, 
    parentName, 
    parentEmail, 
    parentPhone, 
    relationship,
    studentOtp,
    parentOtp,
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

  if (!studentOtp || !parentOtp) {
    return res.status(400).json({ success: false, message: "Student OTP and parent OTP are required" });
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

const validateBulkStudentStatus = (req, res, next) => {
  const { ids, isActive } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Please provide a non-empty array of student IDs",
    });
  }

  const invalidId = ids.find((id) => !mongoose.Types.ObjectId.isValid(id));
  if (invalidId) {
    return res.status(400).json({
      success: false,
      message: `Invalid student ID: ${invalidId}`,
    });
  }

  if (typeof isActive !== "boolean") {
    return res.status(400).json({
      success: false,
      message: "Please provide a boolean value for isActive",
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
  validateBulkStudentStatus,
  validateUpdateStudentOrganization
};
