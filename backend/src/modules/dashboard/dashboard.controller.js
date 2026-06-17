import asyncHandler from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/response.js";
import User from "../users/user.model.js";
import Organization from "../organizations/organization.model.js";
import Hostel from "../hostels/hostel.model.js";
import Student from "../students/student.model.js";
import hostelModel from "../hostels/hostel.model.js";
import mongoose from "mongoose";

const getSuperAdminStats = asyncHandler(async (req, res) => {
  const [adminCount, wardenCount, studentCount, organizationCount, hostelCount] = await Promise.all([
    User.countDocuments({ role: "admin" }),
    User.countDocuments({ role: "warden" }),
    User.countDocuments({ role: "student" }),
    Organization.countDocuments(),
    Hostel.countDocuments(),
  ]);

  return sendSuccess(res, 200, "Dashboard stats fetched successfully", {
    data: {
      organizations: organizationCount,
      admins: adminCount,
      wardens: wardenCount,
      students: studentCount,
      hostels: hostelCount,
    },
  });
});

const getStudentCountByOrganization = asyncHandler(async (req, res) => {
  const stats = await Student.aggregate([
    {
      $group: {
        _id: "$organizationId",
        count: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: "organizations",
        localField: "_id",
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
      $project: {
        _id: 1,
        name: { $ifNull: ["$organization.name", "Unknown Organization"] },
        count: 1,
      },
    },
    {
      $sort: { count: -1 },
    },
  ]);

  return sendSuccess(res, 200, "Student count by organization fetched successfully", {
    data: stats,
  });
});


// admin controllers
const getAdminStats = asyncHandler(async (req, res) => {
  const organizationId = req.user.organization;

  const [wardenCount, studentCount, hostelCount] = await Promise.all([
    User.countDocuments({
      role: "warden",
      organization: organizationId
    }),
    Student.countDocuments({
      organization: organizationId
    }),
    hostelModel.countDocuments({
      organizations: new mongoose.Types.ObjectId(organizationId),
    })
  ]);

return sendSuccess(res, 200, "Dashboard stats fetched successfully", {
  data: {
    wardens: wardenCount,
    students: studentCount,
    hostels: hostelCount,
  },
});
});


export {
  getSuperAdminStats,
  getStudentCountByOrganization,
  getAdminStats,
};
