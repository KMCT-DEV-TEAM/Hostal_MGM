import StudentParent from "../modules/parents/studentParent.model.js";

const verifyStudentAccess = async (req, res, next) => {
  try {
    console.log(req.user);
    // 1. Ensure the user is a parent (Admins/Wardens have different auth flows, or we can allow them if needed, but for V2 parent routes, they must be a parent)
    if (req.user.role !== "parent") {
      // If we want admins to use these same routes, we could check for admin role here and bypass:
      if (['admin', 'super-admin'].includes(req.user.role)) return next();
      return res.status(403).json({
        success: false,
        message: "Access denied. Only parents can access these resources.",
      });
    }

    // 2. Extract studentId from params or body
    const studentId = req.params.studentId || req.body.studentId;
    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: "Student ID is required to access this resource.",
      });
    }

    // 3. Verify the relationship exists and is active
    const parentId = req.user.id;

    // .findOne().lean() is used here so we can grab defaultGuardian and relationship without extra queries in controllers
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

    // Inject the verified student info into the request
    req.student = {
      id: studentId,
      parentId: req.user.id,
      defaultGuardian: link.defaultGuardian,
      relationship: link.relationship
    };

    // 4. Access Granted
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
