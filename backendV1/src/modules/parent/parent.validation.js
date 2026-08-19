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

