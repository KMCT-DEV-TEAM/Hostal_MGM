import Parent from "./parent.model.js";
import Student from "../students/student.model.js";
import { hashPassword } from "../../utils/hash.js";
import mongoose from "mongoose";

const generateRandomPassword = () => {
  return Math.random().toString(36).slice(-10);
};

const createParentDb = async (data) => {
  const {
    studentId,
    parentName,
    relationship,
    phone,
    email,
    address,
    defaultGuardian = false,
  } = data;

  if (!mongoose.Types.ObjectId.isValid(studentId)) {
    throw new Error("Invalid studentId");
  }

  const student = await Student.findById(studentId);
  if (!student) {
    return null;
  }

  const existingParent = await Parent.findOne({ email });
  if (existingParent) {
    throw new Error("Parent email already exists");
  }

  const parentTemporaryPassword = generateRandomPassword();
  const hashedParentPassword = await hashPassword(parentTemporaryPassword);

  if (defaultGuardian) {
    await Parent.updateMany({ studentId }, { defaultGuardian: false });
  }

  const parent = await Parent.create({
    studentId,
    parentName,
    relationship,
    phone,
    email,
    address,
    defaultGuardian,
    password: hashedParentPassword,
    tempPassword: true,
  });

  return {
    parent,
    temporaryPassword: parentTemporaryPassword,
  };
};

const updateParentDb = async (parentProfileId, data) => {
  const parentProfile = await Parent.findById(parentProfileId);
  if (!parentProfile) return null;

  if (data.email && data.email !== parentProfile.email) {
    const existing = await Parent.findOne({ email: data.email, _id: { $ne: parentProfileId } });
    if (existing) {
      throw new Error("Parent email already exists");
    }
    parentProfile.email = data.email;
  }

  if (data.parentName !== undefined) {
    parentProfile.parentName = data.parentName;
  } else if (data.name !== undefined) {
    parentProfile.parentName = data.name;
  }

  if (data.phone !== undefined) parentProfile.phone = data.phone;
  if (data.relationship !== undefined) parentProfile.relationship = data.relationship;
  if (data.address !== undefined) parentProfile.address = data.address;

  if (data.defaultGuardian === true) {
    await Parent.updateMany({ studentId: parentProfile.studentId }, { defaultGuardian: false });
    parentProfile.defaultGuardian = true;
  } else if (data.defaultGuardian === false) {
    parentProfile.defaultGuardian = false;
  }

  await parentProfile.save();

  return { parentProfile };
};

const toggleParentStatusDb = async (parentProfileId) => {
  const parentProfile = await Parent.findById(parentProfileId);
  if (!parentProfile) return null;

  parentProfile.isActive = !parentProfile.isActive;
  await parentProfile.save();

  return { parentProfile };
};

export {
  createParentDb,
  updateParentDb,
  toggleParentStatusDb
};
