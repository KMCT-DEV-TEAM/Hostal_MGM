const validateCreateStudent = (req, res, next) => {
  const {
    studentCode,
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

  if (!studentCode) {
    return res.status(400).json({ success: false, message: "studentCode is required" });
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

export { validateCreateStudent };
