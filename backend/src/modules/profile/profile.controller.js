import { sendSuccess, sendError } from "../../utils/response.js";
import { getProfile } from "./profile.service.js";

const getProfileHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    if (!userId || !role) {
      return sendError(res, 400, "User ID or role missing in request");
    }

    const profileData = await getProfile(userId, role);

    return sendSuccess(res, 200, "Profile fetched successfully", profileData);
  } catch (error) {
    if (error.message.includes("User not found")) {
      return sendError(res, 404, "User not found");
    }
    console.error("Profile fetch error:", error);
    return sendError(res, 500, "Failed to fetch profile");
  }
};

export default {
  getProfile: getProfileHandler,
};

// --- V2 Parent Profile Controller (M:N Architecture) ---
// Since the frontend is scoped per-student, this fetches the specific student's profile 
// as well as the parent's generic user data.
export const getStudentProfileForParentV2 = async (req, res) => {
  try {
    const parentId = req.user.id;
    const studentId = req.params.studentId;

    if (!parentId || !studentId) {
      return sendError(res, 400, "Missing parent or student context.");
    }

    // Instead of importing the whole model or risking cyclic dependencies, just fetch the specific 
    // student's data using the existing service if possible, or directly with Mongoose.
    // For safety since V1 service has tight coupling, we'll fetch explicitly.
    const { default: Student } = await import("../students/student.model.js");
    const { default: Parent } = await import("../parents/parent.model.js");
    const { default: StudentParent } = await import("../parents/studentParent.model.js");

    const parent = await Parent.findById(parentId).select("-password -tokens");
    if (!parent) return sendError(res, 404, "Parent not found");

    const student = await Student.findById(studentId)
      .populate("courseId", "name")
      .populate("departmentId", "name")
      .populate("batchId", "name")
      .populate("hostelId", "name code")
      .populate("organizationId", "name code");

    if (!student) return sendError(res, 404, "Student not found");

    const relationship = await StudentParent.findOne({ parentId, studentId });

    const profileData = {
      user: {
        _id: parent._id,
        name: parent.parentName,
        email: parent.email || "",
        role: "parent",
        phone: parent.phone,
        profileImage: parent.profileImage || "",
        isActive: parent.isActive,
      },
      roleData: {
        student: {
          name: student.name || student.firstName,
          admissionNumber: student.studentId,
          studentId: student.studentId,
          course: student.courseId ? student.courseId.name : null,
          department: student.departmentId ? student.departmentId.name : null,
          batch: student.batchId ? student.batchId.name : null,
          hostel: student.hostelId ? student.hostelId.name : null,
        },
        relation: relationship ? relationship.relationship : "Unknown",
        defaultGuardian: relationship ? relationship.defaultGuardian : false
      }
    };

    return sendSuccess(res, 200, "Profile fetched successfully (V2)", profileData);
  } catch (error) {
    console.error("Profile fetch error V2:", error);
    return sendError(res, 500, "Failed to fetch profile");
  }
};

