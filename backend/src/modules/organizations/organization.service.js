import Organization from "./organization.model.js";

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

const createOrganizationDb = async (data) => {
  return await Organization.create(data);
};

const getAllOrganizationsDb = async () => {
  return await Organization.find().populate("adminId", "name email isActive");
};

const getPaginatedOrganizationsDb = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const [organizations, totalCount] = await Promise.all([
    Organization.find()
      .populate("adminId", "name email isActive")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    Organization.countDocuments(),
  ]);

  return { organizations, totalCount };
};

const getOrganizationByIdDb = async (id) => {
  return await Organization.findById(id).populate("adminId", "name email isActive");
};

const updateOrganizationDb = async (id, data) => {
  return await Organization.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

const toggleOrganizationStatusDb = async (id) => {
  const org = await Organization.findById(id);
  if (!org) return null;

  org.isActive = !org.isActive;
  return await org.save();
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
    // Lookup Parents for the Student
    {
      $lookup: {
        from: "parents",
        localField: "students._id",
        foreignField: "studentId",
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
  createOrganizationDb,
  getAllOrganizationsDb,
  getPaginatedOrganizationsDb,
  getOrganizationByIdDb,
  updateOrganizationDb,
  toggleOrganizationStatusDb,
  getAggregateOrganizationDataDb
}
