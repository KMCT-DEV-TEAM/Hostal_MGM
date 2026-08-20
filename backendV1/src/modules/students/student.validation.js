const validateCreateStudent = (req, res, next) => {
  const {
    studentId,
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

  if (!studentId) {
    return res.status(400).json({ success: false, message: "studentId is required" });
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

const validateStudentIdParam = (req, res, next) => {
  const { id } = req.params;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Student ID",
    });
  }
  next();
};

const validateUpdateStudent = (req, res, next) => {
  const {
    name,
    email,
    phone,
    gender,
    dob,
    organizationId,
    courseId,
    departmentId,
    batchId,
    address,
    isActive,
    studentId
  } = req.body;

  if (
    !name &&
    !email &&
    !phone &&
    !gender &&
    !dob &&
    !organizationId &&
    !courseId &&
    !departmentId &&
    !batchId &&
    !address &&
    isActive === undefined &&
    !studentId
  ) {
    return res.status(400).json({
      success: false,
      message: "At least one field must be provided for update",
    });
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (organizationId && !uuidRegex.test(organizationId)) {
    return res.status(400).json({ success: false, message: "Invalid organizationId" });
  }

  if (courseId && !uuidRegex.test(courseId)) {
    return res.status(400).json({ success: false, message: "Invalid courseId" });
  }

  if (departmentId && !uuidRegex.test(departmentId)) {
    return res.status(400).json({ success: false, message: "Invalid departmentId" });
  }

  if (batchId && !uuidRegex.test(batchId)) {
    return res.status(400).json({ success: false, message: "Invalid batchId" });
  }

  next();
};

export { validateCreateStudent, validateStudentIdParam, validateUpdateStudent };
