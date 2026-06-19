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

  const parentCount = await Parent.countDocuments({ studentId });
  const shouldDefaultGuardian = defaultGuardian || parentCount === 0;

  if (shouldDefaultGuardian) {
    await Parent.updateMany({ studentId }, { defaultGuardian: false });
  }

  const parent = await Parent.create({
    studentId,
    parentName,
    relationship,
    phone,
    email,
    address,
    defaultGuardian: shouldDefaultGuardian,
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
  }

  if (data.phone !== undefined) parentProfile.phone = data.phone;
  if (data.relationship !== undefined) parentProfile.relationship = data.relationship;
  if (data.address !== undefined) parentProfile.address = data.address;

  if (data.defaultGuardian === true) {
    await Parent.updateMany({ studentId: parentProfile.studentId }, { defaultGuardian: false });
    parentProfile.defaultGuardian = true;
  } else if (data.defaultGuardian === false) {
    const parentCount = await Parent.countDocuments({ studentId: parentProfile.studentId });

    if (parentCount <= 1) {
      parentProfile.defaultGuardian = true;
    } else {
      parentProfile.defaultGuardian = false;
      const otherDefault = await Parent.findOne({
        studentId: parentProfile.studentId,
        _id: { $ne: parentProfileId },
        defaultGuardian: true,
      });

      if (!otherDefault) {
        const nextParent = await Parent.findOne({
          studentId: parentProfile.studentId,
          _id: { $ne: parentProfileId },
        });
        if (nextParent) {
          nextParent.defaultGuardian = true;
          await nextParent.save();
        }
      }
    }
  }

  await parentProfile.save();

  return { parentProfile };
};

const setDefaultGuardianDb = async (parentProfileId, defaultGuardian) => {
  const parentProfile = await Parent.findById(parentProfileId);
  if (!parentProfile) return null;

  const studentId = parentProfile.studentId;
  const parentCount = await Parent.countDocuments({ studentId });

  if (defaultGuardian === true) {
    await Parent.updateMany({ studentId }, { defaultGuardian: false });
    parentProfile.defaultGuardian = true;
  } else {
    if (parentCount <= 1) {
      parentProfile.defaultGuardian = true;
    } else {
      parentProfile.defaultGuardian = false;
      const otherDefault = await Parent.findOne({
        studentId,
        _id: { $ne: parentProfileId },
        defaultGuardian: true,
      });

      if (!otherDefault) {
        const nextParent = await Parent.findOne({
          studentId,
          _id: { $ne: parentProfileId },
        });
        if (nextParent) {
          nextParent.defaultGuardian = true;
          await nextParent.save();
        }
      }
    }
  }

  await parentProfile.save();
  return { parentProfile };
};

const getParentsService = async ({ organizationId, query }) => {
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

  const parentMatch = {};

  if (relationship) {
    parentMatch.relationship = relationship;
  }

  if (typeof defaultGuardian !== "undefined") {
    parentMatch.defaultGuardian = defaultGuardian === "true" || defaultGuardian === true;
  }

  if (typeof isActive !== "undefined") {
    parentMatch.isActive = isActive === "true";
  }

  if (studentId && mongoose.Types.ObjectId.isValid(studentId)) {
    parentMatch.studentId = new mongoose.Types.ObjectId(studentId);
  }

  if (organizationId && mongoose.Types.ObjectId.isValid(organizationId)) {
    parentMatch["student.organizationId"] = new mongoose.Types.ObjectId(organizationId);
  }

  const pipeline = [
    
    {
      $lookup: {
        from: "students",
        localField: "studentId",
        foreignField: "_id",
        as: "student",
      },
    },
    {
      $match: parentMatch,
    },
    {
      $unwind: {
        path: "$student",
        preserveNullAndEmptyArrays: false,
      },
    },
  ];

  if (search) {
    pipeline.push({
      $match: {
        $or: [
          {
            parentName: {
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
            relationship: {
              $regex: search,
              $options: "i",
            },
          },
          {
            "student.name": {
              $regex: search,
              $options: "i",
            },
          },
          {
            "student.email": {
              $regex: search,
              $options: "i",
            },
          },
          {
            "student.studentId": {
              $regex: search,
              $options: "i",
            },
          },
        ],
      },
    });
  }
  console.log(pipeline)
  const parents = await Parent.aggregate([
    ...pipeline,
    {
      $project: {
        _id: 1,
        parentName: 1,
        relationship: 1,
        phone: 1,
        email: 1,
        defaultGuardian: 1,
        isActive: 1,
        createdAt: 1,
        student: {
          _id: "$student._id",
          studentId: "$student.studentId",
          name: "$student.name",
          email: "$student.email",
          organizationId: "$student.organizationId",
        },
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

  const totalResult = await Parent.aggregate([
    ...pipeline,
    {
      $count: "total",
    },
  ]);

  const totalRecords = totalResult[0]?.total || 0;

  return {
    parents,
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

const toggleParentStatusDb = async (parentProfileId) => {
  const parentProfile = await Parent.findById(parentProfileId);
  if (!parentProfile) return null;

  parentProfile.isActive = !parentProfile.isActive;
  await parentProfile.save();

  return { parentProfile };
};

const bulkUpdateParentStatusDb = async (ids, isActive) => {
  const query = {
    _id: {
      $in: ids.map((id) => new mongoose.Types.ObjectId(id)),
    },
  };

  return await Parent.updateMany(query, {
    $set: {
      isActive,
    },
  });
};

export {
  createParentDb,
  updateParentDb,
  setDefaultGuardianDb,
  getParentsService,
  toggleParentStatusDb,
  bulkUpdateParentStatusDb,
};
