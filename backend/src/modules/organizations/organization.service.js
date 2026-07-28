import mongoose from "mongoose";
import Organization from "./organization.model.js";
import User from "../users/user.model.js";
import Student from "../students/student.model.js";
import Parent from "../parents/parent.model.js";
import fs from "fs";
import { updateCoursesStatusByQuery } from "../courses/course.service.js";
import { updateStudentsStatusByQuery } from "../students/student.service.js";

const findExistingOrganization = async (code, organisationNumber) => {
  return await Organization.findOne({
    $or: [{ code }, { organisationNumber }]
  });
};

const findExistingOrganizationWithExclude = async (code, organisationNumber, excludeId) => {
  const orConditions = [];
  if (code) orConditions.push({ code });
  if (organisationNumber) orConditions.push({ organisationNumber });

  if (orConditions.length === 0) return null;

  return await Organization.findOne({
    _id: { $ne: excludeId },
    $or: orConditions
  });
};

const checkExistingOrgCodeDb = async (code) => {
  return await Organization.findOne({ code });
};

const checkExistingOrgNumberDb = async (organisationNumber) => {
  return await Organization.findOne({ organisationNumber });
};

const checkExistingOrgEmailDb = async (email) => {
  return await Organization.findOne({ email });
};

const createOrganizationDb = async (data) => {
  return await Organization.create(data);
};

const getAllOrganizationsDb = async () => {
  const organizationsDocs = await Organization.find().populate("adminId", "name email isActive");
  return await Promise.all(organizationsDocs.map(async (org) => {
    const studentsCount = await Student.countDocuments({ organizationId: org._id });
    const orgObj = org.toObject();
    orgObj.studentsCount = studentsCount;
    return orgObj;
  }));
};

const getPaginatedOrganizationsDb = async (page = 1, limit = 10, search = "", status = "All", adminOrganizationId = null) => {
  const query = {};

  if (adminOrganizationId) {
    query._id = adminOrganizationId;
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { code: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
      { address: { $regex: search, $options: "i" } }
    ];
  }

  if (status && status !== "All") {
    query.isActive = status === "Active";
  }

  let organizationsPromise = Organization.find(query)
    .populate("adminId", "name email isActive")
    .sort({ createdAt: -1 });

  if (limit > 0) {
    const skip = (page - 1) * limit;
    organizationsPromise = organizationsPromise.skip(skip).limit(limit);
  }

  const [organizationsDocs, totalCount] = await Promise.all([
    organizationsPromise,
    Organization.countDocuments(query),
  ]);

  const organizations = await Promise.all(organizationsDocs.map(async (org) => {
    const studentsCount = await Student.countDocuments({ organizationId: org._id });
    const orgObj = org.toObject();
    orgObj.studentsCount = studentsCount;
    return orgObj;
  }));



  return { organizations, totalCount };
};

const getOrganizationByIdDb = async (id) => {
  return await Organization.findById(id).populate("adminId", "name email isActive");
};

const updateOrganizationDb = async (id, data) => {
  return await Organization.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

const syncOrganizationStatus = async (orgIds, isActive) => {
  await User.updateMany(
    { organization: { $in: orgIds }, role: "admin" },
    { isActive }
  );

  await updateCoursesStatusByQuery({ organizationId: { $in: orgIds } }, isActive);
  await updateStudentsStatusByQuery({ organizationId: { $in: orgIds } }, isActive);
};

const toggleOrganizationStatusDb = async (id) => {
  const org = await Organization.findById(id);
  if (!org) return null;

  org.isActive = !org.isActive;
  await org.save();

  await syncOrganizationStatus([id], org.isActive);

  return org;
};

const bulkUpdateOrganizationStatusDb = async (ids, isActive) => {
  try {
    const objectIds = ids.map(id => new mongoose.Types.ObjectId(id));
    const result = await Organization.updateMany(
      { _id: { $in: objectIds } },
      { $set: { isActive } }
    );

    await syncOrganizationStatus(objectIds, isActive);

    return result;
  } catch (error) {
    console.error("bulkUpdateOrganizationStatusDb error:", error);
    throw error;
  }
};

const getAggregateOrganizationDataDb = async (organizationId = null) => {
  const pipeline = [];

  if (organizationId) {
    pipeline.push({
      $match: {
        _id: new mongoose.Types.ObjectId(organizationId),
      },
    });
  }

  pipeline.push(
    {
      $lookup: {
        from: "students",
        localField: "_id",
        foreignField: "organizationId",
        as: "students",
      },
    },
    {
      $unwind: {
        path: "$students",
        preserveNullAndEmptyArrays: true,
      },
    },
    // Lookup Student User Details
    {
      $lookup: {
        from: "users",
        localField: "students.userId",
        foreignField: "_id",
        as: "studentUserDetails",
      },
    },
    {
      $unwind: {
        path: "$studentUserDetails",
        preserveNullAndEmptyArrays: true,
      },
    },
    // Lookup Parents for the Student via StudentParent bridging collection
    {
      $lookup: {
        from: "studentparents",
        localField: "students._id",
        foreignField: "studentId",
        as: "studentParentLinks",
      },
    },
    {
      $lookup: {
        from: "parents",
        localField: "studentParentLinks.parentId",
        foreignField: "_id",
        as: "parents",
      },
    },
    {
      $unwind: {
        path: "$parents",
        preserveNullAndEmptyArrays: true,
      },
    },
    // Lookup Parent User Details
    {
      $lookup: {
        from: "users",
        localField: "parents.userId",
        foreignField: "_id",
        as: "parentUserDetails",
      },
    },
    {
      $unwind: {
        path: "$parentUserDetails",
        preserveNullAndEmptyArrays: true,
      },
    },
    // Restructure the data before grouping
    {
      $addFields: {
        "students.name": "$studentUserDetails.name",
        "students.email": "$studentUserDetails.email",
        "students.phone": "$studentUserDetails.phone",
        "students.isActive": "$studentUserDetails.isActive",
        "parents.name": "$parentUserDetails.name",
        "parents.email": "$parentUserDetails.email",
        "parents.phone": "$parentUserDetails.phone",
        "parents.isActive": "$parentUserDetails.isActive",
      }
    },
    // Group parents back into the student object
    {
      $group: {
        _id: {
          orgId: "$_id",
          studentId: "$students._id"
        },
        orgData: { $first: "$$ROOT" },
        parents: {
          $push: {
            $cond: [
              { $ifNull: ["$parents._id", false] },
              "$parents",
              "$$REMOVE"
            ]
          }
        }
      }
    },
    // Rebuild the student object with its parents array
    {
      $addFields: {
        "orgData.students.parentsList": "$parents"
      }
    },
    // Group students back into the organization object
    {
      $group: {
        _id: "$_id.orgId",
        name: { $first: "$orgData.name" },
        code: { $first: "$orgData.code" },
        organisationNumber: { $first: "$orgData.organisationNumber" },
        email: { $first: "$orgData.email" },
        phone: { $first: "$orgData.phone" },
        address: { $first: "$orgData.address" },
        students: {
          $push: {
            $cond: [
              { $ifNull: ["$orgData.students._id", false] },
              "$orgData.students",
              "$$REMOVE"
            ]
          }
        }
      }
    }
  );

  return await Organization.aggregate(pipeline);
};

export {
  findExistingOrganization,
  findExistingOrganizationWithExclude,
  checkExistingOrgCodeDb,
  checkExistingOrgNumberDb,
  checkExistingOrgEmailDb,
  createOrganizationDb,
  getAllOrganizationsDb,
  getPaginatedOrganizationsDb,
  getOrganizationByIdDb,
  updateOrganizationDb,
  toggleOrganizationStatusDb,
  bulkUpdateOrganizationStatusDb,
  getAggregateOrganizationDataDb,
}
