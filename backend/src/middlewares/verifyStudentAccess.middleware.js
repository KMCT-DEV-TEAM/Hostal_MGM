import StudentParent from "../modules/parents/studentParent.model.js";

const verifyStudentAccess = async (req, res, next) => {
  try {
    if (req.user.role !== "parent") {
      if (['admin', 'super-admin', 'mentor', 'assistant_warden', 'student'].includes(req.user.role)) return next();
      return res.status(403).json({
        success: false,
        message: "Access denied. Only parents can access these resources.",
      });
    }

    const studentId = req.params.studentId || req.body.studentId;
    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: "Student ID is required to access this resource.",
      });
    }

    const parentId = req.user.id;

    const link = await StudentParent.findOne({
      parentId: parentId,
      studentId: studentId,
      status: "active",
    }).lean();

    if (!link) {
      return res.status(403).json({
        success: false,
        message: "Forbidden. You do not have authorization to access this student's records.",
      });
    }

    req.params.studentId = studentId;

    req.student = {
      id: studentId,
      parentId: req.user.id,
      defaultGuardian: link.defaultGuardian,
      relationship: link.relationship
    };

    next();
  } catch (error) {
    console.error("verifyStudentAccess Error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while verifying student access permissions.",
    });
  }
};

export default verifyStudentAccess;
