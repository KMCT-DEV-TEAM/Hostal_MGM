import mongoose from "mongoose";
import Organization from "../organizations/organization.model.js";

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
  getAggregateOrganizationDataDb
};
