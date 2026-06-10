import User from "../users/user.model.js";
import Student from "./student.model.js";
import Parent from "../parents/parent.model.js";
import crypto from "crypto";
import { hashPassword } from "../../utils/hash.js";

const generateRandomPassword = () => {
  return crypto.randomBytes(4).toString("hex"); // generates an 8-character string
};

const checkExistingUser = async (email) => {
  return await User.findOne({ email });
};

const createStudentWithParentDb = async (data) => {
  const {
    organizationId,
    name,
    gender,
    dob,
    course,
    department,
    phone,
    email,
    address,
    status,
    parentname,
    parentnumber,
    parentemail,
    parentrelationship,
  } = data;

  // 1. Generate passwords
  const studentPlainPassword = generateRandomPassword();
  const parentPlainPassword = generateRandomPassword();

  const studentHashedPassword = await hashPassword(studentPlainPassword);
  const parentHashedPassword = await hashPassword(parentPlainPassword);

  // 2. Create Student User
  const studentUser = await User.create({
    name,
    email,
    phone,
    password: studentHashedPassword,
    role: "student",
    organization: organizationId,
  });

  // 3. Create Student Profile
  const studentProfile = await Student.create({
    userId: studentUser._id,
    organizationId,
    gender,
    dob,
    course,
    department,
    address,
    status: status || "active",
  });

  // 4. Create Parent User
  const parentUser = await User.create({
    name: parentname,
    email: parentemail,
    phone: parentnumber,
    password: parentHashedPassword,
    role: "parent",
    organization: organizationId,
  });

  // 5. Create Parent Profile
  const parentProfile = await Parent.create({
    userId: parentUser._id,
    studentId: studentProfile._id,
    relationship: parentrelationship,
    address, // Defaulting to student address
  });

  return {
    studentUser,
    studentProfile,
    parentUser,
    parentProfile,
  };
};

const updateStudentDb = async (studentProfileId, data) => {
  const studentProfile = await Student.findById(studentProfileId);
  if (!studentProfile) return null;

  const user = await User.findById(studentProfile.userId);
  if (!user) return null;

  if (data.email && data.email !== user.email) {
    const existing = await User.findOne({ email: data.email });
    if (existing) {
      throw new Error("Student email already exists");
    }
    user.email = data.email;
  }

  // Update User fields
  if (data.name !== undefined) user.name = data.name;
  if (data.phone !== undefined) user.phone = data.phone;
  await user.save();

  // Update Student Profile fields
  if (data.gender !== undefined) studentProfile.gender = data.gender;
  if (data.dob !== undefined) studentProfile.dob = data.dob;
  if (data.course !== undefined) studentProfile.course = data.course;
  if (data.department !== undefined) studentProfile.department = data.department;
  if (data.address !== undefined) studentProfile.address = data.address;
  if (data.status !== undefined) studentProfile.status = data.status;
  await studentProfile.save();

  return { studentProfile, user };
};

const toggleStudentStatusDb = async (studentProfileId) => {
  const studentProfile = await Student.findById(studentProfileId);
  if (!studentProfile) return null;

  const user = await User.findById(studentProfile.userId);
  if (!user) return null;

  user.isActive = !user.isActive;
  await user.save();

  return { studentProfile, user };
};

export {
  checkExistingUser,
  createStudentWithParentDb,
  updateStudentDb,
  toggleStudentStatusDb
};
