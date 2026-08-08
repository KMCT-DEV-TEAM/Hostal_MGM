import { parentRepository } from "./parent.repository.js";
import User from "../users/user.model.js";
import MentorAssignment from "../mentors/mentorAssignment.model.js";
import Student from "../students/student.model.js";

class AuthorizationError extends Error {
  constructor(message, statusCode = 403) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AuthorizationError';
  }
}

/**
 * Ensures the user's authorization scope (org/batches) is fetched exactly once per request.
 * Modifies the `user` object in memory to cache the result.
 */
const getUserScope = async (user) => {
  if (user._scopeHydrated) return user; // Return cached scope if already fetched

  const userId = user.id || user._id;

  if (user.role === "admin") {
    const admin = await User.findById(userId).select("organization").lean();
    if (!admin || !admin.organization) {
      throw new AuthorizationError("Admin is not assigned to any organization", 400);
    }
    user.organizationId = String(admin.organization);
  }

  if (user.role === "mentor") {
    const activeAssignments = await MentorAssignment.find({
      mentorId: userId,
      status: "active",
    }).select("batchId").lean();

    if (!activeAssignments.length) {
      throw new AuthorizationError("You have no active batch assignments", 403);
    }
    user.assignedBatchIds = activeAssignments.map((a) => String(a.batchId));
  }

  user._scopeHydrated = true;
  return user;
};

/**
 * Validates if the user has access to the specified parent.
 * Throws an error if unauthorized. Returns the parent context if authorized.
 */
export const checkParentAccess = async (user, parentId) => {
  // 1. Fetch optimized parent context
  const parentContext = await parentRepository.getParentAuthContext(parentId);
  
  if (!parentContext) {
    throw new AuthorizationError("Parent not found", 404);
  }

  // 2. Super Admin bypass
  if (user.role === "super_admin") {
    return parentContext;
  }

  // 3. Hydrate user scope (cached per request)
  const scopedUser = await getUserScope(user);

  // 4. Admin validation
  if (user.role === "admin") {
    if (!parentContext.linkedOrganizationIds.includes(scopedUser.organizationId)) {
      throw new AuthorizationError("You can only manage parents in your organization", 403);
    }
    return parentContext;
  }

  // 5. Mentor validation
  if (user.role === "mentor") {
    const hasAccess = parentContext.linkedBatchIds.some((batchId) => 
      scopedUser.assignedBatchIds.includes(batchId)
    );

    if (!hasAccess) {
      throw new AuthorizationError("You can only manage parents linked to students in your assigned batches", 403);
    }
    return parentContext;
  }

  // Unhandled roles
  throw new AuthorizationError("You do not have permission to manage parents", 403);
};

/**
 * Validates if the user has access to a specific student (used for creating parents).
 * Throws an error if unauthorized. Returns the student object if authorized.
 */
export const checkStudentAccess = async (user, studentId) => {
  const student = await Student.findById(studentId).select("organizationId batchId").lean();
  
  if (!student) {
    throw new AuthorizationError("Student not found", 404);
  }

  if (user.role === "super_admin") {
    return student;
  }

  // Hydrate user scope (cached per request)
  const scopedUser = await getUserScope(user);

  if (user.role === "admin") {
    if (String(student.organizationId) !== scopedUser.organizationId) {
      throw new AuthorizationError("You can only manage students in your organization", 403);
    }
    return student;
  }

  if (user.role === "mentor") {
    if (!student.batchId || !scopedUser.assignedBatchIds.includes(String(student.batchId))) {
      throw new AuthorizationError("You can only manage students in your assigned batches", 403);
    }
    return student;
  }

  throw new AuthorizationError("You do not have permission to access this student", 403);
};
