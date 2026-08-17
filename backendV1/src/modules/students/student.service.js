import { prisma } from "../../config/prisma.js";
import crypto from "crypto";
import { hashPassword } from "../../utils/hash.js";

const generateRandomPassword = () => {
  return crypto.randomBytes(4).toString("hex");
};

const checkParentConflict = async (existingParent, { parentName, phone, tx }) => {
  if (!existingParent) return;

  const nameDiffers = existingParent.fullName !== parentName;
  const phoneDiffers = existingParent.phone !== phone;

  if (nameDiffers || phoneDiffers) {
    const studentLinks = await tx.studentParent.findMany({
      where: { parentId: existingParent.id },
      include: {
        student: {
          select: { name: true, courseId: true, batchId: true, academicYear: true } // Note: fullName in schema, adapting this
        }
      }
    });

    const linkedStudents = studentLinks.map(link => link.student).filter(Boolean);

    const conflictError = new Error("Parent email already exists with different details");
    conflictError.code = "PARENT_EXISTS_WITH_DIFFERENT_DATA";
    conflictError.statusCode = 409;
    conflictError.conflictData = {
      existing: {
        name: existingParent.fullName,
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
    studentCode,
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
      studentCode,
      organizationId,
      fullName: name,
      gender,
      dob: dob ? new Date(dob) : null,
      courseId: courseId || null,
      departmentId: departmentId || null,
      batchId: batchId || null,
      academicYear,
      phone,
      email,
      passwordHash: hashedStudentPassword,
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

    const nameDiffers = existingParent.fullName !== parentName;
    const phoneDiffers = existingParent.phone !== parentPhone;

    if (resolutionAction === 'update_existing' || (!resolutionAction && !nameDiffers && !phoneDiffers)) {
      existingParent = await tx.parent.update({
        where: { id: existingParent.id },
        data: {
          fullName: parentName || existingParent.fullName,
          email: parentEmail || existingParent.email,
          phone: parentPhone || existingParent.phone
        }
      });
    }
    parentRecord = existingParent;
  } else {
    parentRecord = await tx.parent.create({
      data: {
        fullName: parentName,
        phone: parentPhone,
        email: parentEmail,
        passwordHash: hashedParentPassword,
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
      _id: student.id, // for compatibility
      name: student.fullName // for compatibility
    },
    parent: {
      ...parentRecord,
      _id: parentRecord.id // for compatibility
    },
    temporaryPasswords: {
      student: studentTemporaryPassword,
      parent: parentTemporaryPassword,
    },
    _id: student.id
  };
};
