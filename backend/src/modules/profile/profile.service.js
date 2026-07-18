import jwt from "jsonwebtoken";
import User from "../users/user.model.js";
import Student from "../students/student.model.js";
import Parent from "../parents/parent.model.js";
import Hostel from "../hostels/hostel.model.js";

const getStudentProfile = async (userId) => {
  const student = await Student.findById(userId)
    .populate("organizationId", "name code")
    .populate("courseId", "name")
    .populate("departmentId", "name")
    .populate("batchId", "name")
    .populate("hostelId", "name code");

  if (!student) throw new Error("User not found");

  // Determine assigned warden
  let wardenName = null;
  if (student.hostelId) {
    const hostel = await Hostel.findById(student.hostelId._id).populate("wardens", "name");
    if (hostel && hostel.wardens && hostel.wardens.length > 0) {
      wardenName = hostel.wardens[0].name;
    }
  }

  // Generate QR Token
  const qrToken = jwt.sign(
    {
      studentId: student._id,
      idString: student.studentId,
      name: student.name,
      roomNo: student.roomNumber,
      type: "attendance_qr",
    },
    process.env.JWT_ACCESS_TOKEN
  );

  return {
    user: {
      _id: student._id,
      name: student.name,
      email: student.email,
      role: "student",
      phone: student.phone,
      profileImage: student.profileImage || "",
      isActive: student.isActive,
    },
    roleData: {
      admissionNumber: student.studentId, // fallback since admissionNumber doesn't exist in schema
      studentId: student.studentId,
      course: student.courseId ? student.courseId.name : null,
      department: student.departmentId ? student.departmentId.name : null,
      batch: student.batchId ? student.batchId.name : null,
      currentYear: student.academicYear,
      organization: student.organizationId ? student.organizationId.name : null,
      hostel: student.hostelId
        ? { name: student.hostelId.name, code: student.hostelId.code }
        : null,
      assignedHostels: student.hostelId 
        ? [{ name: student.hostelId.name, code: student.hostelId.code }] 
        : [],
      room: student.roomNumber,
      checkIn: student.joiningDate,
      warden: wardenName,
      qrToken,
    },
  };
};

const getParentProfile = async (userId) => {
  const parent = await Parent.findById(userId).populate("studentId", "name studentId");

  if (!parent) throw new Error("User not found");

  return {
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
      student: parent.studentId
        ? {
            name: parent.studentId.name,
            admissionNumber: parent.studentId.studentId,
            studentId: parent.studentId.studentId,
          }
        : null,
      relation: parent.relationship,
    },
  };
};

const getWardenProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const assignedHostels = await Hostel.find({ wardens: userId }).select("name code");

  return {
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: "warden",
      phone: user.phone,
      profileImage: user.profileImage || "",
      isActive: user.isActive,
    },
    roleData: {
      designation: user.specialization || "Warden",
      assignedHostels: assignedHostels.map(h => ({
        _id: h._id,
        name: h.name,
        code: h.code,
      })),
    },
  };
};

const getAdminProfile = async (userId) => {
  const user = await User.findById(userId).populate("organization", "name code");
  if (!user) throw new Error("User not found");

  return {
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: "admin",
      phone: user.phone,
      profileImage: user.profileImage || "",
      isActive: user.isActive,
    },
    roleData: {
      organization: user.organization ? { name: user.organization.name, code: user.organization.code } : null,
      designation: user.specialization || "Admin",
    },
  };
};

const getSuperAdminProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  return {
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: "super_admin",
      phone: user.phone,
      profileImage: user.profileImage || "",
      isActive: user.isActive,
    },
    roleData: {
      organization: "Super Admin Level",
      systemRole: "Super Administrator",
    },
  };
};

const profileHandlers = {
  student: getStudentProfile,
  parent: getParentProfile,
  warden: getWardenProfile,
  admin: getAdminProfile,
  super_admin: getSuperAdminProfile,
};

export const getProfile = async (userId, role) => {
  const handler = profileHandlers[role];
  if (!handler) {
    throw new Error("Invalid or unsupported role");
  }
  return await handler(userId);
};
