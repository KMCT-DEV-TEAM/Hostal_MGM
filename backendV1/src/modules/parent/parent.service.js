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
