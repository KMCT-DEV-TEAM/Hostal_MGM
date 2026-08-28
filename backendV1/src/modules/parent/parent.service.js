import { parentRepository } from "./parent.repository.js";
import { hashPassword } from "../../utils/hash.js";
import { prisma } from "../../config/prisma.js";

const generateRandomPassword = () => {
  return Math.random().toString(36).slice(-10);
};

export const createParentDb = async (data) => {
  const {
    studentId,
    parentName,
    phone,
    address,
    isVerified = true,
    defaultGuardian = false,
    resolutionAction,
  } = data;

  const email = data.email ? data.email.toLowerCase().trim() : undefined;
  const relationship = data.relationship ? data.relationship.toLowerCase().trim() : "guardian"; // Enum normalization

  // Validate UUID (replaces ObjectId validation)
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  if (!uuidRegex.test(studentId)) {
    throw new Error("Invalid studentId");
  }

  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) {
    throw new Error("Student not found");
  }

  let parentRecord;
  let temporaryPassword = null;

  try {
    await prisma.$transaction(async (tx) => {
      let existingParent = await parentRepository.findParentByEmailOrPhone(email, phone, tx);

      if (existingParent) {
        const existingLink = await parentRepository.findStudentParentLink(studentId, existingParent.id, tx);

        if (existingLink) {
          const conflictError = new Error("This parent is already linked to the student.");
          conflictError.code = "PARENT_ALREADY_LINKED";
          conflictError.statusCode = 409;
          throw conflictError;
        }

        if (!resolutionAction) {
          const nameDiffers = existingParent.parentName !== parentName;
          const phoneDiffers = existingParent.phone !== phone;
          const emailDiffers = Boolean(email && existingParent.email && existingParent.email.toLowerCase() !== email.toLowerCase());

          if (nameDiffers || phoneDiffers || emailDiffers) {
            const studentLinks = await parentRepository.getLinkedStudents(existingParent.id, tx);
            const linkedStudents = studentLinks.map(link => link.studentId).filter(Boolean);

            const conflictError = new Error("Parent email or phone already exists with different details");
            conflictError.code = "PARENT_EXISTS_WITH_DIFFERENT_DATA";
            conflictError.statusCode = 409;
            conflictError.conflictData = {
              existing: {
                name: existingParent.parentName,
                phone: existingParent.phone,
                email: existingParent.email,
                linkedStudents: linkedStudents
              },
              submitted: {
                name: parentName,
                phone: phone,
                email: email || existingParent.email
              }
            };
            throw conflictError;
          }
        }

        if (resolutionAction === 'update_existing' || (!resolutionAction && existingParent.parentName === parentName && existingParent.phone === phone)) {
          parentRecord = await parentRepository.updateParentRecord(existingParent, { parentName, phone, address }, tx);
        } else {
          parentRecord = existingParent;
        }
      } else {
        temporaryPassword = generateRandomPassword();
        const hashedPassword = await hashPassword(temporaryPassword);

        parentRecord = await parentRepository.createParentRecord({
          parentName,
          phone,
          email,
          address,
          isVerified,
          password: hashedPassword,
          tempPassword: true,
        }, tx);
      }

      const linkCount = await parentRepository.countStudentParentLinks(studentId, tx);
      const shouldDefaultGuardian = defaultGuardian || linkCount === 0;

      if (shouldDefaultGuardian) {
        await parentRepository.clearDefaultGuardian(studentId, tx);
      }

      await parentRepository.createStudentParentLink({
        studentId,
        parentId: parentRecord.id,
        relationship: relationship,
        defaultGuardian: shouldDefaultGuardian,
        status: "active"
      }, tx);
    });
  } catch (error) {
    if (error.code === "P2002") {
      const target = Array.isArray(error.meta?.target) ? error.meta.target.join(", ") : error.meta?.target || "";
      if (target.includes("student_id") || target.includes("parent_id") || target.includes("studentId_parentId")) {
        const conflictError = new Error("This parent is already linked to the student.");
        conflictError.code = "PARENT_ALREADY_LINKED";
        conflictError.statusCode = 409;
        throw conflictError;
      }

      const existing = await parentRepository.findParentByEmailOrPhone(email, phone);
      if (existing) {
        const studentLinks = await parentRepository.getLinkedStudents(existing.id);
        const linkedStudents = studentLinks.map(link => link.studentId).filter(Boolean);

        const conflictError = new Error("Parent email or phone already exists with different details");
        conflictError.code = "PARENT_EXISTS_WITH_DIFFERENT_DATA";
        conflictError.statusCode = 409;
        conflictError.conflictData = {
          existing: {
            name: existing.parentName,
            phone: existing.phone,
            email: existing.email,
            linkedStudents: linkedStudents
          },
          submitted: {
            name: parentName,
            phone: phone,
            email: email || existing.email
          }
        };
        throw conflictError;
      }
    }
    throw error;
  }

  // Response Compatibility Mapping
  return {
    parent: {
      ...parentRecord,
      _id: parentRecord.id, // Emulate Mongo _id
      studentId,
      relationship,
      defaultGuardian,
    },
    temporaryPassword,
  };
};

export const updateParentDb = async (parentProfileId, data) => {
  const parentProfile = await prisma.parent.findUnique({ where: { id: parentProfileId } });
  if (!parentProfile) return null;

  if (data.email && data.email !== parentProfile.email) {
    const existing = await prisma.parent.findFirst({ where: { email: data.email, id: { not: parentProfileId } } });
    if (existing) {
      throw new Error("Parent email already exists");
    }
  }

  if (data.phone && data.phone !== parentProfile.phone) {
    const existing = await prisma.parent.findFirst({ where: { phone: data.phone, id: { not: parentProfileId } } });
    if (existing) {
      throw new Error("Parent phone already exists");
    }
  }

  const parentData = {};
  if (data.email !== undefined) parentData.email = data.email;
  if (data.parentName !== undefined) parentData.parentName = data.parentName;
  if (data.phone !== undefined) parentData.phone = data.phone;
  // if (data.address !== undefined) parentData.address = data.address; // Schema has no address for Parent

  if (Object.keys(parentData).length > 0) {
    await prisma.parent.update({ where: { id: parentProfileId }, data: parentData });
  }

  // Handle M:N relationship fields using a transaction
  if (data.relationship !== undefined || data.defaultGuardian !== undefined) {
    await prisma.$transaction(async (tx) => {
      const links = await tx.studentParent.findMany({ where: { parentId: parentProfileId } });

      for (const link of links) {
        const linkData = {};
        if (data.relationship !== undefined) {
          linkData.relationship = data.relationship;
        }

        if (data.defaultGuardian === true) {
          await tx.studentParent.updateMany({
            where: { studentId: link.studentId, parentId: { not: parentProfileId } },
            data: { defaultGuardian: false }
          });
          linkData.defaultGuardian = true;
        } else if (data.defaultGuardian === false) {
          const linkCount = await tx.studentParent.count({ where: { studentId: link.studentId } });
          if (linkCount <= 1) {
            linkData.defaultGuardian = true; // Must have at least one
          } else {
            linkData.defaultGuardian = false;
            const otherDefault = await tx.studentParent.findFirst({
              where: { studentId: link.studentId, parentId: { not: parentProfileId }, defaultGuardian: true }
            });
            if (!otherDefault) {
              const nextParent = await tx.studentParent.findFirst({
                where: { studentId: link.studentId, parentId: { not: parentProfileId } }
              });
              if (nextParent) {
                await tx.studentParent.update({
                  where: { id: nextParent.id },
                  data: { defaultGuardian: true }
                });
              }
            }
          }
        }

        if (Object.keys(linkData).length > 0) {
          await tx.studentParent.update({
            where: { id: link.id },
            data: linkData
          });
        }
      }
    });
  }

  const updatedParent = await prisma.parent.findUnique({ where: { id: parentProfileId } });
  const mockLink = await prisma.studentParent.findFirst({ where: { parentId: parentProfileId } });

  const responseObj = { ...updatedParent, _id: updatedParent.id };
  responseObj.studentId = mockLink ? mockLink.studentId : null;
  responseObj.relationship = mockLink ? mockLink.relationship : (data.relationship || "guardian");
  responseObj.defaultGuardian = mockLink ? mockLink.defaultGuardian : (data.defaultGuardian || false);

  return { parentProfile: responseObj };
};

export const changeParentEmailDb = async (parentId, newEmail) => {
  const existingParent = await prisma.parent.findFirst({
    where: { email: newEmail, id: { not: parentId } }
  });

  if (existingParent) {
    throw new Error("Parent email already exists");
  }

  const parent = await prisma.parent.update({
    where: { id: parentId },
    data: { email: newEmail, isVerified: true }
  });

  return parent;
};

export const toggleParentStatusDb = async (parentProfileId) => {
  const parentProfile = await prisma.parent.findUnique({
    where: { id: parentProfileId }
  });

  if (!parentProfile) return null;

  const updatedParent = await prisma.parent.update({
    where: { id: parentProfileId },
    data: { isActive: !parentProfile.isActive }
  });

  return { parentProfile: { ...updatedParent, _id: updatedParent.id } };
};

export const setDefaultGuardianDb = async (parentProfileId, defaultGuardian) => {
  const parentProfile = await prisma.parent.findUnique({
    where: { id: parentProfileId },
    select: {
      id: true,
      parentName: true,
      phone: true,
      email: true,
      tempPassword: true,
      isVerified: true,
      isActive: true,
      failedLoginAttempts: true,
      lockUntil: true,
      settings: true,
      createdAt: true,
      updatedAt: true,
      deletedAt: true
    }
  });

  if (!parentProfile) {
    return null;
  }

  const links = await prisma.studentParent.findMany({
    where: { parentId: parentProfileId }
  });

  if (!links.length) {
    throw new Error("Parent is not linked to any student");
  }

  for (const link of links) {
    if (defaultGuardian === true) {
      // Remove default from all other parents of this student
      await prisma.studentParent.updateMany({
        where: { studentId: link.studentId, parentId: { not: parentProfileId } },
        data: { defaultGuardian: false }
      });
      link.defaultGuardian = true;
    } else {
      const linkCount = await prisma.studentParent.count({
        where: { studentId: link.studentId }
      });

      if (linkCount <= 1) {
        throw new Error("Student must have at least one default guardian");
      }

      link.defaultGuardian = false;

      const existingGuardian = await prisma.studentParent.findFirst({
        where: {
          studentId: link.studentId,
          parentId: { not: parentProfileId },
          defaultGuardian: true,
        },
      });

      if (!existingGuardian) {
        const nextParent = await prisma.studentParent.findFirst({
          where: {
            studentId: link.studentId,
            parentId: { not: parentProfileId },
          },
        });

        if (nextParent) {
          await prisma.studentParent.update({
            where: { id: nextParent.id },
            data: { defaultGuardian: true }
          });
        }
      }
    }

    await prisma.studentParent.update({
      where: { id: link.id },
      data: { defaultGuardian: link.defaultGuardian }
    });
  }

  return { parentProfile: { ...parentProfile, _id: parentProfile.id, defaultGuardian } };
};

export const getParentsService = async ({ organizationId, hostelIds, batchIds, query }) => {
  const {
    page = 1,
    limit = 10,
    search = "",
    relationship,
    defaultGuardian,
    isActive,
    studentId,
  } = query;

  const pageNumber = Number(page);
  const limitNumber = Number(limit);
  const skip = (pageNumber - 1) * limitNumber;

  const where = {};

  if (relationship) {
    where.relationship = relationship;
  }

  if (typeof defaultGuardian !== "undefined") {
    where.defaultGuardian = defaultGuardian === "true" || defaultGuardian === true;
  }

  if (typeof isActive !== "undefined") {
    where.parent = { isActive: isActive === "true" };
  }

  const studentFilters = {};

  if (studentId) {
    studentFilters.id = studentId;
  }

  if (organizationId) {
    studentFilters.organizationId = organizationId;
  }

  if (hostelIds && Array.isArray(hostelIds) && hostelIds.length > 0) {
    studentFilters.studentHostels = {
      some: { hostelId: { in: hostelIds }, status: "active" }
    };
  }

  if (batchIds && Array.isArray(batchIds) && batchIds.length > 0) {
    studentFilters.batchId = { in: batchIds };
  }

  if (Object.keys(studentFilters).length > 0) {
    where.student = studentFilters;
  }

  if (search) {
    where.OR = [
      { parent: { parentName: { contains: search, mode: "insensitive" } } },
      { parent: { email: { contains: search, mode: "insensitive" } } },
      { parent: { phone: { contains: search, mode: "insensitive" } } },
      { relationship: { contains: search, mode: "insensitive" } },
      { student: { name: { contains: search, mode: "insensitive" } } },
      { student: { email: { contains: search, mode: "insensitive" } } },
      { student: { admissionNo: { contains: search, mode: "insensitive" } } },
    ];
  }

  const studentParents = await prisma.studentParent.findMany({
    where,
    include: {
      parent: true,
      student: {
        include: {
          organization: true,
        }
      }
    },
    orderBy: { createdAt: "desc" },
    skip,
    take: limitNumber,
  });

  const totalRecords = await prisma.studentParent.count({ where });

  const parents = studentParents.map(sp => ({
    _id: sp.parent.id,
    parentName: sp.parent.parentName,
    relationship: sp.relationship,
    phone: sp.parent.phone,
    email: sp.parent.email,
    defaultGuardian: sp.defaultGuardian,
    isActive: sp.parent.isActive,
    createdAt: sp.parent.createdAt,
    student: {
      _id: sp.student.id,
      admissionNo: sp.student.admissionNo,
      name: sp.student.name,
      email: sp.student.email,
      organizationId: sp.student.organizationId,
    },
    organization: sp.student.organization ? {
      _id: sp.student.organization.id,
      name: sp.student.organization.name,
    } : null,
  }));

  return {
    parents,
    pagination: {
      page: pageNumber,
      limit: limitNumber,
      totalRecords,
      totalPages: Math.ceil(totalRecords / limitNumber),
    },
  };
};

export const exportParentsService = async ({ organizationId, query }) => {
  const {
    search = "",
    relationship,
    defaultGuardian,
    isActive,
    studentId,
  } = query;

  const where = {};

  if (relationship) {
    where.relationship = relationship;
  }

  if (typeof defaultGuardian !== "undefined") {
    where.defaultGuardian = defaultGuardian === "true" || defaultGuardian === true;
  }

  if (typeof isActive !== "undefined") {
    where.parent = { isActive: isActive === "true" };
  }

  const studentFilters = {};

  if (studentId) {
    studentFilters.id = studentId;
  }

  if (organizationId) {
    studentFilters.organizationId = organizationId;
  }

  if (Object.keys(studentFilters).length > 0) {
    where.student = studentFilters;
  }

  if (search) {
    where.OR = [
      { parent: { parentName: { contains: search, mode: "insensitive" } } },
      { parent: { email: { contains: search, mode: "insensitive" } } },
      { parent: { phone: { contains: search, mode: "insensitive" } } },
      { relationship: { contains: search, mode: "insensitive" } },
      { student: { name: { contains: search, mode: "insensitive" } } },
      { student: { email: { contains: search, mode: "insensitive" } } },
      { student: { admissionNo: { contains: search, mode: "insensitive" } } },
    ];
  }

  const studentParents = await prisma.studentParent.findMany({
    where,
    include: {
      parent: true,
      student: {
        include: {
          organization: true,
        }
      }
    },
    orderBy: { createdAt: "desc" },
  });

  const parents = studentParents.map(sp => ({
    _id: sp.parent.id,
    parentName: sp.parent.parentName,
    relationship: sp.relationship,
    phone: sp.parent.phone,
    email: sp.parent.email,
    defaultGuardian: sp.defaultGuardian,
    isActive: sp.parent.isActive,
    createdAt: sp.parent.createdAt,
    student: {
      _id: sp.student.id,
      admissionNo: sp.student.admissionNo,
      name: sp.student.name,
      email: sp.student.email,
      organizationId: sp.student.organizationId,
    },
    organization: sp.student.organization ? {
      _id: sp.student.organization.id,
      name: sp.student.organization.name,
    } : null,
  }));

  return { parents };
};

export const getParentStudentsService = async (parentId, filters = {}) => {
  const studentFilters = {};

  if (filters.studentStatus) {
    if (!["active", "inactive"].includes(filters.studentStatus)) {
      throw new Error("Invalid studentStatus. Allowed values: active, inactive");
    }
    studentFilters.isActive = filters.studentStatus === "active";
  }

  // Setup hostel filters for Prisma's StudentHostel relation
  const hostelFilters = {};
  let hasHostelFilter = false;

  if (filters.hostelStatus) {
    if (!["active", "inactive"].includes(filters.hostelStatus)) {
      throw new Error("Invalid hostelStatus. Allowed values: active, inactive");
    }
    // Only "active" means they currently reside there. If "inactive", it means no active allocation.
    if (filters.hostelStatus === "active") {
      hostelFilters.status = "active";
      hasHostelFilter = true;
    } else {
      // In Prisma, we might handle "inactive" by enforcing they don't have an active StudentHostel.
      studentFilters.studentHostels = { none: { status: "active" } };
    }
  }

  if (filters.hostelId) {
    hostelFilters.hostelId = filters.hostelId;
    hostelFilters.status = "active";
    hasHostelFilter = true;
  }

  if (hasHostelFilter) {
    studentFilters.studentHostels = { some: hostelFilters };
  }

  if (filters.courseId) studentFilters.courseId = filters.courseId;
  if (filters.departmentId) studentFilters.departmentId = filters.departmentId;
  if (filters.batchId) studentFilters.batchId = filters.batchId;
  if (filters.organizationId) studentFilters.organizationId = filters.organizationId;

  if (filters.studentId) {
    // Attempting to maintain the fallback of 'admissionNo' vs UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(filters.studentId)) {
      studentFilters.id = filters.studentId;
    } else {
      studentFilters.admissionNo = filters.studentId;
    }
  }

  if (filters.studentName) {
    studentFilters.name = { contains: filters.studentName, mode: "insensitive" };
  }

  const links = await prisma.studentParent.findMany({
    where: {
      parentId: parentId,
      status: "active",
      student: studentFilters
    },
    include: {
      student: {
        include: {
          course: true,
          department: true,
          batch: true,
          studentHostels: {
            where: { status: "active" },
            include: { hostel: true }
          }
        }
      }
    },
    orderBy: {
      student: { name: "asc" }
    }
  });

  return links.map(link => {
    const activeHostel = link.student.studentHostels[0];
    return {
      _id: link.student.id,
      id: link.student.id,
      studentId: link.student.admissionNo,
      name: link.student.name,
      roomNumber: activeHostel?.roomNumber || null,
      hostelId: activeHostel?.hostel.id || null,
      hostelName: activeHostel?.hostel.name || null,
      courseId: link.student.course?.id || null,
      courseName: link.student.course?.name || null,
      departmentId: link.student.department?.id || null,
      departmentName: link.student.department?.name || null,
      batchId: link.student.batch?.id || null,
      batchName: link.student.batch?.name || null
    };
  });
};
