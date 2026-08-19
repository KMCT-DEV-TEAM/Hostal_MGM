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

  await prisma.$transaction(async (tx) => {
    let existingParent = email ? await parentRepository.findParentByEmail(email, tx) : null;

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

        if (nameDiffers || phoneDiffers) {
          const studentLinks = await parentRepository.getLinkedStudents(existingParent.id, tx);
          const linkedStudents = studentLinks.map(link => link.studentId).filter(Boolean);

          const conflictError = new Error("Parent email already exists with different details");
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
              email: existingParent.email
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

