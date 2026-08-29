import { prisma } from "../config/prisma.js";
import { sendError } from "../utils/response.js";
import { ROLES } from "../constants/roles.js";

const verifyStudentAccess = async (req, res, next) => {
  try {
    const roleLower = (req.user?.role || "").toLowerCase();

    if (roleLower !== ROLES.PARENT) {
      if ([ROLES.ADMIN, "superadmin", ROLES.SUPER_ADMIN, ROLES.WARDEN, ROLES.ASSISTANT_WARDEN, ROLES.MENTOR, ROLES.STUDENT].includes(roleLower)) {
        return next();
      }
      return sendError(res, 403, "Access denied. Only parents can access these resources.");
    }

    const studentId = req.params?.studentId || req.body?.studentId || req.query?.studentId;
    if (!studentId) {
      return sendError(res, 400, "Student ID is required to access this resource.");
    }

    const parentId = req.user.id;

    const link = await prisma.studentParent.findFirst({
      where: {
        parentId: parentId,
        studentId: studentId,
      },
    });

    if (!link) {
      return sendError(res, 403, "Forbidden. You do not have authorization to access this student's records.");
    }

    req.params.studentId = studentId;
    req.student = {
      id: studentId,
      parentId: req.user.id,
      relationship: link.relationship,
    };

    next();
  } catch (error) {
    console.error("verifyStudentAccess Error:", error);
    return sendError(res, 500, "An error occurred while verifying student access permissions.");
  }
};

export default verifyStudentAccess;
