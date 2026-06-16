import User from "../users/user.model.js";
import Student from "./student.model.js";
import Parent from "../parents/parent.model.js";
import crypto from "crypto";
import { hashPassword } from "../../utils/hash.js";
import mongoose from "mongoose";

const generateRandomPassword = () => {
  return crypto.randomBytes(4).toString("hex"); // generates an 8-character string
};

const checkExistingUser = async (email) => {
  return await User.findOne({ email });
};

const createStudentWithParentDb = async (
  data,
  session
) => {
  const {
    studentId,
    organizationId,
    hostelId,
    name,
    gender,
    dob,
    course,
    department,
    academicYear,
    phone,
    email,
    address,
    hostelStatus,
    parentName,
    parentPhone,
    parentEmail,
    relationship,
  } = data;

  const studentTemporaryPassword = generateRandomPassword();
  const parentTemporaryPassword = generateRandomPassword();
  const hashedStudentPassword = await hashPassword(studentTemporaryPassword);
  const hashedParentPassword = await hashPassword(parentTemporaryPassword);

  const student = await Student.create(
    [
      {
        studentId,
        organizationId,
        hostelId,
        name,
        gender,
        dob,
        course,
        department,
        academicYear,
        phone,
        email,
        password: hashedStudentPassword,
        tempPassword: true,
        address,
        hostelStatus,
      },
    ],
    { session }
  );

  const parent = await Parent.create(
    [
      {
        studentId: student[0]._id,
        parentName,
        relationship,
        phone: parentPhone,
        password: hashedParentPassword,
        tempPassword: true,
        defaultGuardian: true,
        email: parentEmail,
      },
    ],
    { session }
  );



  return {
    student: student[0],
    parent: parent[0],
    temporaryPasswords: {
      student: studentTemporaryPassword,
      parent: parentTemporaryPassword,
    },
  };
};

const updateStudentDb = async (studentId, data) => {
  const student = await Student.findById(studentId);

  if (!student) {
    return null;
  }

  // Email uniqueness check
  if (
    data.email &&
    data.email !== student.email
  ) {
    const existingStudent = await Student.findOne({
      email: data.email,
      _id: { $ne: studentId },
    });

    if (existingStudent) {
      throw new Error("Student email already exists");
    }
  }

  const allowedFields = [
    "studentId",
    "name",
    "email",
    "phone",
    "gender",
    "dob",
    "course",
    "department",
    "academicYear",
    "address",
    "hostelId",
    "hostelStatus",
    "isActive",
  ];

  allowedFields.forEach((field) => {
    if (data[field] !== undefined) {
      student[field] = data[field];
    }
  });

  await student.save();

  return student;
};




const getStudentsService = async ({
  organizationId,
  query,
}) => {
  const {
    page = 1,
    limit = 10,
    search = "",
    hostelId,
    department,
    course,
    hostelStatus,
    isActive,
  } = query;

  const pageNumber = Number(page);
  const limitNumber = Number(limit);
  const skip = (pageNumber - 1) * limitNumber;

  const matchStage = {};

  if (organizationId) {
    matchStage.organizationId =
      new mongoose.Types.ObjectId(
        organizationId
      );
  }

  if (department) {
    matchStage.department = department;
  }

  if (course) {
    matchStage.course = course;
  }

  if (hostelStatus) {
    matchStage.hostelStatus = hostelStatus;
  }

  if (typeof isActive !== "undefined") {
    matchStage.isActive = isActive === "true";
  }

  if (
    hostelId &&
    mongoose.Types.ObjectId.isValid(hostelId)
  ) {
    matchStage.hostelId =
      new mongoose.Types.ObjectId(hostelId);
  }

  const searchMatch = search
    ? {
      $or: [
        {
          name: {
            $regex: search,
            $options: "i",
          },
        },
        {
          email: {
            $regex: search,
            $options: "i",
          },
        },
        {
          phone: {
            $regex: search,
            $options: "i",
          },
        },
        {
          studentId: {
            $regex: search,
            $options: "i",
          },
        },
      ],
    }
    : {};

  const pipeline = [
    {
      $match: matchStage,
    },

    {
      $lookup: {
        from: "hostels",
        localField: "hostelId",
        foreignField: "_id",
        as: "hostel",
      },
    },

    {
      $unwind: {
        path: "$hostel",
        preserveNullAndEmptyArrays: true,
      },
    },

    {
      $lookup: {
        from: "parents",
        localField: "_id",
        foreignField: "studentId",
        as: "parents",
      },
    },

    {
      $match: searchMatch,
    },
  ];

  const students = await Student.aggregate([
    ...pipeline,

    {
      $project: {
        _id: 1,
        studentId: 1,
        name: 1,
        email: 1,
        phone: 1,
        gender: 1,
        dob: 1,
        course: 1,
        department: 1,
        academicYear: 1,
        address: 1,
        hostelStatus: 1,
        isActive: 1,
        createdAt: 1,

        hostel: {
          _id: "$hostel._id",
          name: "$hostel.name",
          code: "$hostel.code",
          hosteltype: "$hostel.hosteltype",
        },

        parents: 1,
      },
    },

    {
      $sort: {
        createdAt: -1,
      },
    },

    {
      $skip: skip,
    },

    {
      $limit: limitNumber,
    },
  ]);

  const totalResult = await Student.aggregate([
    ...pipeline,
    {
      $count: "total",
    },
  ]);

  const totalRecords =
    totalResult[0]?.total || 0;

  return {
    students,
    pagination: {
      page: pageNumber,
      limit: limitNumber,
      totalRecords,
      totalPages: Math.ceil(
        totalRecords / limitNumber
      ),
      hasNextPage:
        pageNumber <
        Math.ceil(totalRecords / limitNumber),
      hasPreviousPage: pageNumber > 1,
    },
  };
};




export {
  checkExistingUser,
  createStudentWithParentDb,
  updateStudentDb,
  getStudentsService,
};
