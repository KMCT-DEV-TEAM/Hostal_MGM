import jwt from 'jsonwebtoken';
import { prisma } from '../../config/prisma.js';

const getStudentProfile = async (userId) => {
  const student = await prisma.student.findUnique({
    where: { id: userId },
    include: {
      organization: { select: { id: true, name: true, code: true } },
      course: { select: { id: true, name: true } },
      department: { select: { id: true, name: true } },
      batch: { select: { id: true, name: true } },
      studentHostels: {
        where: { status: 'active' },
        include: {
          hostel: {
            include: {
              wardens: {
                include: {
                  user: { select: { id: true, name: true, phone: true } }
                }
              }
            }
          }
        }
      }
    }
  });

  if (!student) throw new Error("User not found");

  const activeAllocation = student.studentHostels?.[0];
  const hostel = activeAllocation?.hostel;
  const primaryWarden = hostel?.wardens?.[0]?.user;

  const wardenObj = primaryWarden ? {
    name: primaryWarden.name,
    phone: primaryWarden.phone || hostel?.phone || null
  } : null;

  const qrToken = jwt.sign(
    {
      studentId: student.id,
      admissionNo: student.admissionNo,
      name: student.name,
      roomNo: activeAllocation?.roomNumber || null,
      type: "attendance_qr",
    },
    process.env.JWT_ACCESS_TOKEN || 'fallback_secret'
  );

  return {
    user: {
      _id: student.id,
      id: student.id,
      name: student.name,
      email: student.email,
      role: "student",
      phone: student.phone,
      profileImage: student.settings?.profileImage || "",
      isActive: student.isActive,
      settings: student.settings || {},
    },
    roleData: {
      admissionNumber: student.admissionNo,
      studentId: student.admissionNo,
      course: student.course?.name || null,
      department: student.department?.name || null,
      batch: student.batch?.name || null,
      currentYear: student.academicYear,
      organization: student.organization?.name || null,
      hostel: hostel ? { name: hostel.name, code: hostel.code } : null,
      assignedHostels: hostel ? [{ _id: hostel.id, id: hostel.id, name: hostel.name, code: hostel.code }] : [],
      room: activeAllocation?.roomNumber || null,
      checkIn: student.joiningDate,
      warden: wardenObj,
      qrToken,
    },
  };
};

const getParentProfile = async (userId) => {
  const parent = await prisma.parent.findUnique({
    where: { id: userId },
    include: {
      studentParents: {
        where: { status: 'active' },
        include: {
          student: {
            include: {
              organization: true,
              course: true,
              department: true,
              batch: true,
              studentHostels: {
                where: { status: 'active' },
                include: {
                  hostel: {
                    include: {
                      wardens: {
                        include: {
                          user: { select: { id: true, name: true, phone: true } }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  if (!parent || !parent.isActive) {
    throw new Error("Parent profile not found or account is deactivated.");
  }

  const studentsList = (parent.studentParents || []).map((relation) => {
    const student = relation.student;
    if (!student) return null;

    const activeAlloc = student.studentHostels?.[0];
    const hostel = activeAlloc?.hostel;
    const primaryWarden = hostel?.wardens?.[0]?.user;

    return {
      _id: student.id,
      id: student.id,
      name: student.name,
      email: student.email || "",
      phone: student.phone || "",
      admissionNumber: student.admissionNo,
      studentId: student.admissionNo,
      roomNo: activeAlloc?.roomNumber || "Unassigned",
      academicYear: student.academicYear || "N/A",
      course: student.course?.name || null,
      department: student.department?.name || null,
      batch: student.batch?.name || null,
      organization: student.organization ? { name: student.organization.name, code: student.organization.code } : null,
      hostel: hostel ? { name: hostel.name, code: hostel.code, contact: hostel.phone } : null,
      warden: primaryWarden ? { name: primaryWarden.name, phone: primaryWarden.phone || hostel?.phone || null } : null,
      relation: relation.relationship,
      defaultGuardian: relation.defaultGuardian,
      profileImage: student.settings?.profileImage || "",
      joiningDate: student.joiningDate,
    };
  }).filter(Boolean);

  return {
    user: {
      _id: parent.id,
      id: parent.id,
      name: parent.parentName || parent.name,
      email: parent.email || "",
      role: "parent",
      phone: parent.phone,
      isActive: parent.isActive,
      settings: parent.settings || {},
    },
    roleData: {
      students: studentsList,
    },
  };
};

const getWardenProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      organization: { select: { id: true, name: true, code: true } },
      hostelWardens: {
        include: {
          hostel: { select: { id: true, name: true, code: true } }
        }
      }
    }
  });

  if (!user) throw new Error("User not found");

  const assignedHostels = (user.hostelWardens || []).map(hw => ({
    _id: hw.hostel.id,
    id: hw.hostel.id,
    name: hw.hostel.name,
    code: hw.hostel.code,
  }));

  const roleLower = (user.role || '').toLowerCase();
  const designation = roleLower === 'assistant_warden' ? 'Assistant Warden' : (user.settings?.specialization || 'Warden');

  return {
    user: {
      _id: user.id,
      id: user.id,
      name: user.name,
      email: user.email,
      role: roleLower,
      phone: user.phone,
      profileImage: user.settings?.profileImage || "",
      isActive: user.isActive,
      settings: user.settings || {},
    },
    roleData: {
      designation,
      assignedHostels,
      organization: user.organization ? { name: user.organization.name, code: user.organization.code } : null,
    },
  };
};

const getAdminProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      organization: { select: { id: true, name: true, code: true } }
    }
  });

  if (!user) throw new Error("User not found");

  return {
    user: {
      _id: user.id,
      id: user.id,
      name: user.name,
      email: user.email,
      role: "admin",
      phone: user.phone,
      profileImage: user.settings?.profileImage || "",
      isActive: user.isActive,
      settings: user.settings || {},
    },
    roleData: {
      organization: user.organization ? { name: user.organization.name, code: user.organization.code } : null,
      designation: user.settings?.specialization || "Admin",
    },
  };
};

const getSuperAdminProfile = async (userId) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");

  return {
    user: {
      _id: user.id,
      id: user.id,
      name: user.name,
      email: user.email,
      role: "super_admin",
      phone: user.phone,
      profileImage: user.settings?.profileImage || "",
      isActive: user.isActive,
      settings: user.settings || {},
    },
    roleData: {
      organization: "Super Admin Level",
      systemRole: "Super Administrator",
    },
  };
};

const getMaintenanceStaffProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      organization: { select: { id: true, name: true, code: true } }
    }
  });

  if (!user) throw new Error("User not found");

  return {
    user: {
      _id: user.id,
      id: user.id,
      name: user.name,
      email: user.email,
      role: "maintenance_staff",
      phone: user.phone,
      profileImage: user.settings?.profileImage || "",
      isActive: user.isActive,
      settings: user.settings || {},
    },
    roleData: {
      organization: user.organization ? { name: user.organization.name, code: user.organization.code } : null,
      designation: user.settings?.specialization || "Maintenance Staff",
    },
  };
};

const profileHandlers = {
  student: getStudentProfile,
  parent: getParentProfile,
  warden: getWardenProfile,
  assistant_warden: getWardenProfile,
  admin: getAdminProfile,
  super_admin: getSuperAdminProfile,
  maintenance_staff: getMaintenanceStaffProfile,
};

export const getProfile = async (userId, role) => {
  const normalizedRole = (role || '').toLowerCase();
  const handler = profileHandlers[normalizedRole];
  if (!handler) {
    throw new Error("Invalid or unsupported role");
  }
  return await handler(userId);
};
