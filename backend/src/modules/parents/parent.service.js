import Parent from "./parent.model.js";
import Student from "../students/student.model.js";
import StudentParent from "./studentParent.model.js";
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
    address,
    isVerified = true,
    defaultGuardian = false,
    resolutionAction,
  } = data;

  const email = data.email ? data.email.toLowerCase().trim() : undefined;

  if (!mongoose.Types.ObjectId.isValid(studentId)) {
    throw new Error("Invalid studentId");
  }

  const student = await Student.findById(studentId);
  if (!student) {
    throw new Error("Student not found");
  }

  const session = await mongoose.startSession();
  let parentRecord;
  let temporaryPassword = null;

  try {
    session.startTransaction();

    let existingParent = await Parent.findOne({ email }).session(session);

    if (existingParent) {
      if (!resolutionAction) {
        const nameDiffers = existingParent.parentName !== parentName;
        const phoneDiffers = existingParent.phone !== phone;

        if (nameDiffers || phoneDiffers) {
          const studentLinks = await StudentParent.find({ parentId: existingParent._id })
            .populate({
              path: 'studentId',
              select: 'name course batch academicYear'
            }).session(session);

          const linkedStudents = studentLinks
            .map(link => link.studentId)
            .filter(Boolean);

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
            submitted: { name: parentName, phone, email },
          };
          throw conflictError;
        }
      }

      if (resolutionAction === 'update_existing' || (!resolutionAction && existingParent.parentName === parentName && existingParent.phone === phone)) {
        if (parentName) existingParent.parentName = parentName;
        if (phone) existingParent.phone = phone;
        if (address) existingParent.address = address;
        await existingParent.save({ session });
      }

      parentRecord = existingParent;
    } else {
      temporaryPassword = generateRandomPassword();
      const hashedPassword = await hashPassword(temporaryPassword);

      const created = await Parent.create([{
        parentName,
        phone,
        email,
        address,
        isVerified,
        password: hashedPassword,
        tempPassword: true,
      }], { session });
      parentRecord = created[0];
    }

    // Determine if should be default guardian
    const linkCount = await StudentParent.countDocuments({ studentId }).session(session);
    const shouldDefaultGuardian = defaultGuardian || linkCount === 0;

    if (shouldDefaultGuardian) {
      await StudentParent.updateMany(
        { studentId },
        { $set: { defaultGuardian: false } },
        { session }
      );
    }

    const existingLink = await StudentParent.findOne({
      studentId,
      parentId: parentRecord._id
    }).session(session);

    if (!existingLink) {
      await StudentParent.create([{
        studentId,
        parentId: parentRecord._id,
        relationship: relationship || "guardian",
        defaultGuardian: shouldDefaultGuardian,
        status: "active"
      }], { session });
    } else {
      if (resolutionAction !== 'use_existing') {
        existingLink.relationship = relationship || existingLink.relationship;
      }
      if (shouldDefaultGuardian) existingLink.defaultGuardian = true;
      existingLink.status = "active";
      await existingLink.save({ session });
    }

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }

  // Create a merged response object to keep V1 API shape
  const parentObj = parentRecord.toObject ? parentRecord.toObject() : parentRecord;
  parentObj.studentId = studentId;
  parentObj.relationship = relationship || "guardian";
  parentObj.defaultGuardian = defaultGuardian;

  return {
    parent: parentObj,
    temporaryPassword,
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

  if (data.parentName !== undefined) parentProfile.parentName = data.parentName;
  if (data.phone !== undefined) parentProfile.phone = data.phone;
  if (data.address !== undefined) parentProfile.address = data.address;

  await parentProfile.save();

  // Handle M:N relationship fields
  if (data.relationship !== undefined || data.defaultGuardian !== undefined) {
    const links = await StudentParent.find({ parentId: parentProfileId });

    for (const link of links) {
      if (data.relationship !== undefined) {
        link.relationship = data.relationship;
      }

      if (data.defaultGuardian === true) {
        // Remove default from others for this student
        await StudentParent.updateMany(
          { studentId: link.studentId, parentId: { $ne: parentProfileId } },
          { $set: { defaultGuardian: false } }
        );
        link.defaultGuardian = true;
      } else if (data.defaultGuardian === false) {
        const linkCount = await StudentParent.countDocuments({ studentId: link.studentId });
        if (linkCount <= 1) {
          // Must have at least one, so keep it true
          link.defaultGuardian = true;
        } else {
          link.defaultGuardian = false;
          // Ensure another guardian is default
          const otherDefault = await StudentParent.findOne({
            studentId: link.studentId,
            parentId: { $ne: parentProfileId },
            defaultGuardian: true
          });
          if (!otherDefault) {
            const nextParent = await StudentParent.findOne({
              studentId: link.studentId,
              parentId: { $ne: parentProfileId }
            });
            if (nextParent) {
              nextParent.defaultGuardian = true;
              await nextParent.save();
            }
          }
        }
      }
      await link.save();
    }
  }

  // Inject a mock studentId for legacy API response format
  const mockLink = await StudentParent.findOne({ parentId: parentProfileId });
  const responseObj = parentProfile.toObject();
  responseObj.studentId = mockLink ? mockLink.studentId : null;
  responseObj.relationship = mockLink ? mockLink.relationship : (data.relationship || "guardian");
  responseObj.defaultGuardian = mockLink ? mockLink.defaultGuardian : (data.defaultGuardian || false);

  return { parentProfile: responseObj };
};


const setDefaultGuardianDb = async (parentProfileId, defaultGuardian) => {
  const parentProfile = await Parent.findById(parentProfileId);

  if (!parentProfile) {
    return null;
  }

  const links = await StudentParent.find({ parentId: parentProfileId });
  if (!links.length) {
    throw new Error("Parent is not linked to any student");
  }

  for (const link of links) {
    if (defaultGuardian === true) {
      // Remove default from all other parents of this student
      await StudentParent.updateMany(
        { studentId: link.studentId, parentId: { $ne: parentProfileId } },
        { $set: { defaultGuardian: false } }
      );
      link.defaultGuardian = true;
    } else {
      const linkCount = await StudentParent.countDocuments({ studentId: link.studentId });
      if (linkCount <= 1) {
        throw new Error("Student must have at least one default guardian");
      }

      link.defaultGuardian = false;

      const existingGuardian = await StudentParent.findOne({
        studentId: link.studentId,
        parentId: { $ne: parentProfileId },
        defaultGuardian: true,
      });

      if (!existingGuardian) {
        const nextParent = await StudentParent.findOne({
          studentId: link.studentId,
          parentId: { $ne: parentProfileId },
        });

        if (nextParent) {
          nextParent.defaultGuardian = true;
          await nextParent.save();
        }
      }
    }
    await link.save();
  }

  const responseObj = parentProfile.toObject();
  responseObj.defaultGuardian = defaultGuardian;

  return { parentProfile: responseObj };
};

const getParentsService = async ({ organizationId, hostelIds, batchIds, query }) => {
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

  if (hostelIds && Array.isArray(hostelIds) && hostelIds.length > 0) {
    parentMatch["student.hostelId"] = { $in: hostelIds.map(id => new mongoose.Types.ObjectId(id)) };
  }

  if (batchIds && Array.isArray(batchIds) && batchIds.length > 0) {
    parentMatch["student.batchId"] = { $in: batchIds.map(id => new mongoose.Types.ObjectId(id)) };
  }

  const pipeline = [
    {
      $lookup: {
        from: "studentparents",
        localField: "_id",
        foreignField: "parentId",
        as: "sp"
      }
    },
    {
      $unwind: {
        path: "$sp",
        preserveNullAndEmptyArrays: false
      }
    },
    {
      $lookup: {
        from: "students",
        localField: "sp.studentId",
        foreignField: "_id",
        as: "student",
      },
    },
    {
      $unwind: {
        path: "$student",
        preserveNullAndEmptyArrays: false,
      },
    },
    {
      $addFields: {
        relationship: "$sp.relationship",
        defaultGuardian: "$sp.defaultGuardian"
      }
    },
    {
      $match: parentMatch,
    },
    {
      $lookup: {
        from: "organizations",
        localField: "student.organizationId",
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
        organization: {
          _id: "$organization._id",
          name: "$organization.name",
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

const exportParentsService = async ({ organizationId, query }) => {
  const {
    search = "",
    relationship,
    defaultGuardian,
    isActive,
    studentId,
  } = query;

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
        from: "studentparents",
        localField: "_id",
        foreignField: "parentId",
        as: "sp"
      }
    },
    {
      $unwind: {
        path: "$sp",
        preserveNullAndEmptyArrays: false
      }
    },
    {
      $lookup: {
        from: "students",
        localField: "sp.studentId",
        foreignField: "_id",
        as: "student",
      },
    },
    {
      $unwind: {
        path: "$student",
        preserveNullAndEmptyArrays: false,
      },
    },
    {
      $addFields: {
        relationship: "$sp.relationship",
        defaultGuardian: "$sp.defaultGuardian"
      }
    },
    {
      $match: parentMatch,
    },
    {
      $lookup: {
        from: "organizations",
        localField: "student.organizationId",
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
  ];

  if (search) {
    pipeline.push({
      $match: {
        $or: [
          { parentName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
          { relationship: { $regex: search, $options: "i" } },
          { "student.name": { $regex: search, $options: "i" } },
          { "student.email": { $regex: search, $options: "i" } },
          { "student.studentId": { $regex: search, $options: "i" } },
        ],
      },
    });
  }

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
        organization: {
          _id: "$organization._id",
          name: "$organization.name",
        },
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
  ]);

  return { parents };
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
  exportParentsService,
  toggleParentStatusDb,
  bulkUpdateParentStatusDb,
};
