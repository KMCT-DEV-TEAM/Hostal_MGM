import { prisma } from "../../config/prisma.js";
import crypto from "crypto";
import { hashPassword } from "../../utils/hash.js";

const generateRandomPassword = () => {
  return crypto.randomBytes(4).toString("hex");
};

const checkParentConflict = async (existingParent, { parentName, phone, tx }) => {
  if (!existingParent) return;

  const nameDiffers = existingParent.name !== parentName;
  const phoneDiffers = existingParent.phone !== phone;

  if (nameDiffers || phoneDiffers) {
    const studentLinks = await tx.studentParent.findMany({
      where: { parentId: existingParent.id },
      include: {
        student: {
          select: { name: true, courseId: true, batchId: true, academicYear: true } // Note: name in schema, adapting this
        }
      }
    });

    const linkedStudents = studentLinks.map(link => link.student).filter(Boolean);

    const conflictError = new Error("Parent email already exists with different details");
    conflictError.code = "PARENT_EXISTS_WITH_DIFFERENT_DATA";
    conflictError.statusCode = 409;
    conflictError.conflictData = {
      existing: {
        name: existingParent.name,
        phone: existingParent.phone,
        email: existingParent.email,
        linkedStudents: linkedStudents
      },
      submitted: {
        name: parentName,
        phone: phone,
        email: existingParent.email
      }
    };
    throw conflictError;
  }
};

export const createStudentWithParentDb = async (data, tx) => {
  const {
    admissionNo,
    organizationId,
    name,
    gender,
    dob,
    courseId,
    departmentId,
    batchId,
    academicYear,
    phone,
    email,
    address,
    parentName,
    parentPhone,
    parentEmail,
    relationship,
    resolutionAction,
  } = data;

  const studentTemporaryPassword = generateRandomPassword();
  const parentTemporaryPassword = generateRandomPassword();
  const hashedStudentPassword = await hashPassword(studentTemporaryPassword);
  const hashedParentPassword = await hashPassword(parentTemporaryPassword);

  const student = await tx.student.create({
    data: {
      admissionNo,
      organizationId,
      name: name,
      gender,
      dob: dob ? new Date(dob) : null,
      courseId: courseId || null,
      departmentId: departmentId || null,
      batchId: batchId || null,
      academicYear,
      phone,
      email,
      password: hashedStudentPassword,
      tempPassword: true,
      isVerified: true,
      address,
    }
  });

  let parentRecord;
  let existingParent = await tx.parent.findFirst({
    where: {
      OR: [
        { email: parentEmail },
        { phone: parentPhone }
      ]
    }
  });

  if (existingParent) {
    if (!resolutionAction) {
      await checkParentConflict(existingParent, { parentName, phone: parentPhone, tx });
    }

    const nameDiffers = existingParent.parentName !== parentName;
    const phoneDiffers = existingParent.phone !== parentPhone;

    if (resolutionAction === 'update_existing' || (!resolutionAction && !nameDiffers && !phoneDiffers)) {
      existingParent = await tx.parent.update({
        where: { id: existingParent.id },
        data: {
          parentName: parentName || existingParent.parentName,
          email: parentEmail || existingParent.email,
          phone: parentPhone || existingParent.phone
        }
      });
    }
    parentRecord = existingParent;
  } else {
    parentRecord = await tx.parent.create({
      data: {
        parentName: parentName,
        phone: parentPhone,
        email: parentEmail,
        password: hashedParentPassword,
        tempPassword: true,
        isVerified: true,
      }
    });
  }

  await tx.studentParent.create({
    data: {
      studentId: student.id,
      parentId: parentRecord.id,
      relationship: relationship || "guardian",
      defaultGuardian: true,
      status: "active"
    }
  });

  return {
    student: {
      ...student,
      _id: student.id,
      name: student.name
    },
    parent: {
      ...parentRecord,
      _id: parentRecord.id
    },
    temporaryPasswords: {
      student: studentTemporaryPassword,
      parent: parentTemporaryPassword,
    },
    _id: student.id
  };
};

export const updateStudentDb = async (studentId, data) => {
  const student = await prisma.student.findUnique({
    where: { id: studentId }
  });

  if (!student) {
    return null;
  }

  if (data.email && data.email !== student.email) {
    const existingStudent = await prisma.student.findFirst({
      where: {
        email: data.email,
        id: { not: studentId }
      }
    });

    if (existingStudent) {
      throw { statusCode: 400, message: "Student email already exists" };
    }
  }

  const allowedFieldsMap = {
    admissionNo: "admissionNo",
    name: "name",
    email: "email",
    phone: "phone",
    gender: "gender",
    dob: "dob",
    courseId: "courseId",
    departmentId: "departmentId",
    batchId: "batchId",
    academicYear: "academicYear",
    address: "address",
    isActive: "isActive",
  };

  const updateData = {};

  Object.keys(allowedFieldsMap).forEach((field) => {
    if (data[field] !== undefined) {
      const dbField = allowedFieldsMap[field];
      updateData[dbField] = field === "dob" && data[field] ? new Date(data[field]) : data[field];
    }
  });

  const updatedStudent = await prisma.student.update({
    where: { id: studentId },
    data: updateData
  });

  return {
    ...updatedStudent,
    _id: updatedStudent.id,
    name: updatedStudent.name
  };
};

export const getStudentsService = async ({
  organizationId,
  hostelIds,
  batchIds,
  query,
}) => {
  const {
    page = 1,
    limit = 10,
    search = "",
    hostelId,
    departmentId,
    courseId,
    batchId,
    hostelStatus,
    isActive,
  } = query;

  const pageNumber = Number(page);
  const limitNumber = Number(limit);
  const skip = (pageNumber - 1) * limitNumber;

  const where = {};

  if (organizationId) {
    where.organizationId = organizationId;
  }

  if (departmentId) {
    where.departmentId = departmentId;
  }

  if (courseId) {
    where.courseId = courseId;
  }

  if (batchId) {
    where.batchId = batchId;
  } else if (batchIds && Array.isArray(batchIds) && batchIds.length > 0) {
    where.batchId = { in: batchIds };
  }

  if (typeof isActive !== "undefined") {
    where.isActive = isActive === "true";
  }

  const hostelFilters = {};
  let applyHostelFilter = false;

  if (hostelId) {
    hostelFilters.hostelId = hostelId;
    applyHostelFilter = true;
  } else if (hostelIds && Array.isArray(hostelIds) && hostelIds.length > 0) {
    hostelFilters.hostelId = { in: hostelIds };
    applyHostelFilter = true;
  }

  if (hostelStatus) {
    hostelFilters.status = hostelStatus.toLowerCase();
    applyHostelFilter = true;
  }

  if (applyHostelFilter) {
    where.studentHostels = { some: hostelFilters };
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
      { admissionNo: { contains: search, mode: 'insensitive' } },
    ];
  }

  const studentsRecords = await prisma.student.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip,
    take: limitNumber,
    include: {
      organization: { select: { id: true, name: true } },
      course: { select: { id: true, name: true, code: true } },
      department: { select: { id: true, name: true, code: true } },
      batch: { select: { id: true, name: true, code: true } },
      studentHostels: {
        where: { status: "active" },
        include: { hostel: { select: { id: true, name: true } } }
      }
    }
  });

  const totalRecords = await prisma.student.count({ where });

  const students = studentsRecords.map(student => ({
    _id: student.id,
    admissionNo: student.admissionNo,
    organizationId: student.organizationId,
    name: student.name,
    email: student.email,
    isActive: student.isActive,
    createdAt: student.createdAt,
    organization: student.organization ? {
      _id: student.organization.id,
      name: student.organization.name
    } : null,
    course: student.course ? {
      _id: student.course.id,
      name: student.course.name,
      code: student.course.code
    } : null,
    department: student.department ? {
      _id: student.department.id,
      name: student.department.name,
      code: student.department.code
    } : null,
    batch: student.batch ? {
      _id: student.batch.id,
      name: student.batch.name,
      code: student.batch.code
    } : null,
    hostel: student.studentHostels?.[0]?.hostel ? {
      _id: student.studentHostels[0].hostel.id,
      name: student.studentHostels[0].hostel.name
    } : null,
  }));

  return {
    students,
    pagination: {
      page: pageNumber,
      limit: limitNumber,
      totalRecords,
      totalPages: Math.ceil(totalRecords / limitNumber),
      hasNextPage: pageNumber < Math.ceil(totalRecords / limitNumber),
      hasPreviousPage: pageNumber > 1,
    },
  };
};

export const getStudentFilterOptionsService = async ({
  role,
  userId,
  organizationId,
  filterType,
  search = '',
  page = 1,
  limit = 10
}) => {
  const where = {};

  if (role === "admin") {
    const admin = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true }
    });

    if (!admin?.organizationId) {
      throw { statusCode: 400, message: "Admin is not assigned to any organization" };
    }

    where.organizationId = admin.organizationId;
  }

  if (role === "super_admin" && organizationId) {
    where.organizationId = organizationId;
  }

  if (role === "mentor") {
    const activeAssignments = await prisma.mentorAssignment.findMany({
      where: {
        mentorId: userId,
        status: "ACTIVE",
      },
      select: { batchId: true }
    });

    if (activeAssignments.length === 0) {
      where.id = "00000000-0000-0000-0000-000000000000"; // Impossible UUID to match 0 students
    } else {
      where.batchId = { in: activeAssignments.map((a) => a.batchId) };
    }
  }

  // NOTE: intentionally leaving warden without filters to match old logic exactly.

  if (filterType) {
    const pageNumber = Number(page) || 1;
    const limitNumber = Number(limit) || 10;
    const skip = (pageNumber - 1) * limitNumber;

    let options = [];
    let hasMore = false;

    if (filterType === 'course') {
      const records = await prisma.course.findMany({
        where: {
          name: { contains: search, mode: "insensitive" },
          students: { some: where }
        },
        select: { id: true, name: true, code: true },
        orderBy: { name: 'asc' },
        skip,
        take: limitNumber + 1
      });
      hasMore = records.length > limitNumber;
      options = (hasMore ? records.slice(0, limitNumber) : records).map(r => ({ value: r.id, label: r.name, code: r.code }));
    } else if (filterType === 'department') {
      const records = await prisma.department.findMany({
        where: {
          name: { contains: search, mode: "insensitive" },
          students: { some: where }
        },
        select: { id: true, name: true, code: true },
        orderBy: { name: 'asc' },
        skip,
        take: limitNumber + 1
      });
      hasMore = records.length > limitNumber;
      options = (hasMore ? records.slice(0, limitNumber) : records).map(r => ({ value: r.id, label: r.name, code: r.code }));
    } else if (filterType === 'hostel') {
      const records = await prisma.hostel.findMany({
        where: {
          name: { contains: search, mode: "insensitive" },
          studentHostels: { some: { student: where, status: "active" } }
        },
        select: { id: true, name: true, code: true },
        orderBy: { name: 'asc' },
        skip,
        take: limitNumber + 1
      });
      hasMore = records.length > limitNumber;
      options = (hasMore ? records.slice(0, limitNumber) : records).map(r => ({ value: r.id, label: r.name, code: r.code }));
    } else if (filterType === 'organization') {
      const records = await prisma.organization.findMany({
        where: {
          name: { contains: search, mode: "insensitive" },
          students: { some: where }
        },
        select: { id: true, name: true, code: true },
        orderBy: { name: 'asc' },
        skip,
        take: limitNumber + 1
      });
      hasMore = records.length > limitNumber;
      options = (hasMore ? records.slice(0, limitNumber) : records).map(r => ({ value: r.id, label: r.name, code: r.code }));
    }

    return { options, hasMore };
  }

  const [courses, departments, batches, hostels, organizations] = await Promise.all([
    prisma.course.findMany({
      where: { students: { some: where } },
      select: { id: true, name: true, code: true },
      orderBy: { name: 'asc' }
    }),
    prisma.department.findMany({
      where: { students: { some: where } },
      select: { id: true, name: true, code: true },
      orderBy: { name: 'asc' }
    }),
    prisma.batch.findMany({
      where: { students: { some: where } },
      select: { id: true, name: true, code: true },
      orderBy: { name: 'asc' }
    }),
    prisma.hostel.findMany({
      where: { studentHostels: { some: { student: where, status: "active" } } },
      select: { id: true, name: true, code: true },
      orderBy: { name: 'asc' }
    }),
    role === "super_admin" ? prisma.organization.findMany({
      where: { students: { some: where } },
      select: { id: true, name: true, code: true },
      orderBy: { name: 'asc' }
    }) : Promise.resolve([])
  ]);

  return {
    courses: courses.map(r => ({ value: r.id, label: r.name, code: r.code })),
    departments: departments.map(r => ({ value: r.id, label: r.name, code: r.code })),
    batches: batches.map(r => ({ value: r.id, label: r.name, code: r.code })),
    hostels: hostels.map(r => ({ value: r.id, label: r.name, code: r.code })),
    organizations: role === "super_admin" ? organizations.map(r => ({ value: r.id, label: r.name, code: r.code })) : [],
    statuses: [
      { label: "Active", value: "true" },
      { label: "Inactive", value: "false" },
    ],
  };
};
