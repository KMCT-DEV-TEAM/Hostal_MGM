import User from "../users/user.model.js";
import Student from "./student.model.js";
import Parent from "../parents/parent.model.js";
import crypto from "crypto";
import { hashPassword } from "../../utils/hash.js";
import mongoose from "mongoose";
import Hostel from "../hostels/hostel.model.js";
import { syncHostelOrganizations } from "../hostels/hostel.service.js";

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
    courseId,
    departmentId,
    batchId,
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
        courseId,
        departmentId,
        batchId,
        academicYear,
        phone,
        email,
        password: hashedStudentPassword,
        tempPassword: true,
        isVerified: true,
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
        isVerified: true,
        email: parentEmail,
      },
    ],
    { session }
  );

  if (hostelId && organizationId) {
    await Hostel.findByIdAndUpdate(
      hostelId,
      { $addToSet: { organizations: organizationId } },
      { session }
    );
  }

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
    "courseId",
    "departmentId",
    "batchId",
    "academicYear",
    "address",
    "hostelStatus",
    "isActive",
  ];

  const isStatusChanged = data.isActive !== undefined && data.isActive !== student.isActive;

  allowedFields.forEach((field) => {
    if (data[field] !== undefined) {
      student[field] = data[field];
    }
  });

  await student.save();

  if (isStatusChanged) {
    await Parent.updateMany({ studentId: student._id }, { isActive: student.isActive });

    if (!student.isActive) {
      const { getIo } = await import("../../config/socket.js");
      getIo()?.to(student._id.toString()).emit("accountDeactivated");
      const parents = await Parent.find({ studentId: student._id }).select("_id");
      parents.forEach(p => getIo()?.to(p._id.toString()).emit("accountDeactivated"));
    }
  }

  return student;
};

const bulkUpdateStudentStatusDb = async (
  ids,
  isActive,
  organizationId = null
) => {
  const query = {
    _id: {
      $in: ids.map((id) => new mongoose.Types.ObjectId(id)),
    },
  };

  if (organizationId) {
    query.organizationId = new mongoose.Types.ObjectId(
      organizationId
    );
  }

  const students = await Student.find(query).select("_id hostelId");
  const studentIds = students.map((s) => s._id);

  const result = await Student.updateMany(query, {
    $set: {
      isActive,
    },
  });

  if (studentIds.length > 0) {
    await Parent.updateMany(
      { studentId: { $in: studentIds } },
      { $set: { isActive } }
    );

    if (!isActive) {
      const { getIo } = await import("../../config/socket.js");
      studentIds.forEach(id => getIo()?.to(id.toString()).emit("accountDeactivated"));
      const parents = await Parent.find({ studentId: { $in: studentIds } }).select("_id");
      parents.forEach(p => getIo()?.to(p._id.toString()).emit("accountDeactivated"));
    }
  }

  const affectedHostels = [...new Set(students.map(s => s.hostelId?.toString()).filter(Boolean))];
  for (const hId of affectedHostels) {
    await syncHostelOrganizations(hId);
  }

  return result;
};

const updateStudentsStatusByQuery = async (query, isActive) => {
  const students = await Student.find(query).select("_id hostelId");
  const studentIds = students.map((s) => s._id);
  if (studentIds.length > 0) {
    await Student.updateMany({ _id: { $in: studentIds } }, { isActive });
    await Parent.updateMany({ studentId: { $in: studentIds } }, { isActive });

    if (!isActive) {
      const { getIo } = await import("../../config/socket.js");
      studentIds.forEach(id => getIo()?.to(id.toString()).emit("accountDeactivated"));
      const parents = await Parent.find({ studentId: { $in: studentIds } }).select("_id");
      parents.forEach(p => getIo()?.to(p._id.toString()).emit("accountDeactivated"));
    }

    const affectedHostels = [...new Set(students.map(s => s.hostelId?.toString()).filter(Boolean))];
    for (const hId of affectedHostels) {
      await syncHostelOrganizations(hId);
    }
  }
};


const getStudentsService = async ({
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

  const matchStage = {};

  if (organizationId) {
    matchStage.organizationId =
      new mongoose.Types.ObjectId(
        organizationId
      );
  }

  if (departmentId && mongoose.Types.ObjectId.isValid(departmentId)) {
    matchStage.departmentId =
      new mongoose.Types.ObjectId(departmentId);
  }

  if (courseId && mongoose.Types.ObjectId.isValid(courseId)) {
    matchStage.courseId =
      new mongoose.Types.ObjectId(courseId);
  }

  if (batchId && mongoose.Types.ObjectId.isValid(batchId)) {
    matchStage.batchId =
      new mongoose.Types.ObjectId(batchId);
  } else if (batchIds && Array.isArray(batchIds) && batchIds.length > 0) {
    matchStage.batchId = { $in: batchIds.map(id => new mongoose.Types.ObjectId(id)) };
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
  } else if (hostelIds && Array.isArray(hostelIds) && hostelIds.length > 0) {
    matchStage.hostelId = { $in: hostelIds.map(id => new mongoose.Types.ObjectId(id)) };
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
        from: "organizations",
        localField: "organizationId",
        foreignField: "_id",
        as: "organization",
      },
    },

    {
      $unwind: {
        path: "$organization",
        preserveNullAndEmptyArrays: true,
      },
    },

    {
      $lookup: {
        from: "courses",
        localField: "courseId",
        foreignField: "_id",
        as: "course",
      },
    },

    {
      $unwind: {
        path: "$course",
        preserveNullAndEmptyArrays: true,
      },
    },

    {
      $lookup: {
        from: "departments",
        localField: "departmentId",
        foreignField: "_id",
        as: "department",
      },
    },

    {
      $unwind: {
        path: "$department",
        preserveNullAndEmptyArrays: true,
      },
    },

    {
      $lookup: {
        from: "batches",
        localField: "batchId",
        foreignField: "_id",
        as: "batch",
      },
    },

    {
      $unwind: {
        path: "$batch",
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
        organizationId: 1,
        name: 1,
        email: 1,
        phone: 1,
        gender: 1,
        dob: 1,
        academicYear: 1,
        address: 1,
        hostelStatus: 1,
        isActive: 1,
        createdAt: 1,
        organization: {
          _id: "$organization._id",
          name: "$organization.name",
          code: "$organization.code",
        },

        hostel: {
          _id: "$hostel._id",
          name: "$hostel.name",
          code: "$hostel.code",
          hosteltype: "$hostel.hosteltype",
        },

        course: {
          _id: "$course._id",
          name: "$course.name",
          code: "$course.code",
        },

        department: {
          _id: "$department._id",
          name: "$department.name",
          code: "$department.code",
        },

        batch: {
          _id: "$batch._id",
          name: "$batch.name",
          code: "$batch.code",
        },

        parents: 1,
      },
    },

    {
      $unset: ["parents.password", "password"],
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

const getStudentFilterOptionsService = async ({
  role,
  userId,
  organizationId,
}) => {
  const matchStage = {};

  if (role === "admin") {
    const admin = await User.findById(userId).select("organization").lean();

    if (!admin?.organization) {
      const error = new Error("Admin is not assigned to any organization");
      error.statusCode = 400;
      throw error;
    }

    matchStage.organizationId = new mongoose.Types.ObjectId(admin.organization);
  }

  if (role === "super_admin" && organizationId) {
    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      const error = new Error("Invalid organizationId");
      error.statusCode = 400;
      throw error;
    }

    matchStage.organizationId = new mongoose.Types.ObjectId(organizationId);
  }

  const [result = {}] = await Student.aggregate([
    { $match: matchStage },

    // Lookup hostel
    {
      $lookup: {
        from: "hostels",
        localField: "hostelId",
        foreignField: "_id",
        as: "hostel",
      },
    },
    { $unwind: { path: "$hostel", preserveNullAndEmptyArrays: true } },

    {
      $facet: {
        courses: [
          { $match: { courseId: { $ne: null } } },
          {
            $lookup: {
              from: "courses",
              localField: "courseId",
              foreignField: "_id",
              as: "course",
            },
          },
          { $unwind: "$course" },
          {
            $group: {
              _id: "$course._id",
              name: { $first: "$course.name" },
              code: { $first: "$course.code" },
            },
          },
          { $sort: { name: 1 } },
          {
            $project: {
              _id: 0,
              value: { $toString: "$_id" },
              label: "$name",
              code: "$code",
            },
          },
        ],

        departments: [
          { $match: { departmentId: { $ne: null } } },
          {
            $lookup: {
              from: "departments",
              localField: "departmentId",
              foreignField: "_id",
              as: "department",
            },
          },
          { $unwind: "$department" },
          {
            $group: {
              _id: "$department._id",
              name: { $first: "$department.name" },
              code: { $first: "$department.code" },
            },
          },
          { $sort: { name: 1 } },
          {
            $project: {
              _id: 0,
              value: { $toString: "$_id" },
              label: "$name",
              code: "$code",
            },
          },
        ],

        batches: [
          { $match: { batchId: { $ne: null } } },
          {
            $lookup: {
              from: "batches",
              localField: "batchId",
              foreignField: "_id",
              as: "batch",
            },
          },
          { $unwind: "$batch" },
          {
            $group: {
              _id: "$batch._id",
              name: { $first: "$batch.name" },
              code: { $first: "$batch.code" },
            },
          },
          { $sort: { name: 1 } },
          {
            $project: {
              _id: 0,
              value: { $toString: "$_id" },
              label: "$name",
              code: "$code",
            },
          },
        ],

        hostels: [
          { $match: { "hostel._id": { $ne: null } } },
          {
            $group: {
              _id: "$hostel._id",
              name: { $first: "$hostel.name" },
              code: { $first: "$hostel.code" },
            },
          },
          { $sort: { name: 1 } },
          {
            $project: {
              _id: 0,
              value: { $toString: "$_id" },
              label: "$name",
              code: "$code",
            },
          },
        ],

        organizations: [
          {
            $lookup: {
              from: "organizations",
              localField: "organizationId",
              foreignField: "_id",
              as: "organization",
            },
          },
          { $unwind: { path: "$organization", preserveNullAndEmptyArrays: false } },
          {
            $group: {
              _id: "$organization._id",
              name: { $first: "$organization.name" },
              code: { $first: "$organization.code" },
            },
          },
          { $sort: { name: 1 } },
          {
            $project: {
              _id: 0,
              value: { $toString: "$_id" },
              label: "$name",
              code: "$code",
            },
          },
        ],
      },
    },
  ]);

  return {
    courses: result.courses || [],
    departments: result.departments || [],
    batches: result.batches || [],
    hostels: result.hostels || [],
    organizations: role === "super_admin" ? result.organizations || [] : [],
    statuses: [
      { label: "Active", value: "true" },
      { label: "Inactive", value: "false" },
    ],
  };
};




export {
  checkExistingUser,
  createStudentWithParentDb,
  updateStudentDb,
  bulkUpdateStudentStatusDb,
  getStudentsService,
  getStudentFilterOptionsService,
  updateStudentsStatusByQuery,
};
