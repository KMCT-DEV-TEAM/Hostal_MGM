import asyncHandler from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/response.js";
import User from "../users/user.model.js";
import Organization from "../organizations/organization.model.js";
import Hostel from "../hostels/hostel.model.js";
import Student from "../students/student.model.js";
import hostelModel from "../hostels/hostel.model.js";
import mongoose from "mongoose";

const getSuperAdminStats = asyncHandler(async (req, res) => {
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);

  const [
    admins,
    wardens,
    students,
    organizations,
    hostels,
    adminLastMonthCount,
    wardenLastMonthCount,
    studentLastMonthCount,
    organizationLastMonthCount,
    hostelLastMonthCount,
  ] = await Promise.all([
    User.countDocuments({ role: "admin" }),
    User.countDocuments({ role: "warden" }),
    Student.countDocuments(),
    Organization.countDocuments(),
    Hostel.countDocuments(),

    User.countDocuments({
      role: "admin",
      createdAt: { $gte: lastMonth },
    }),

    User.countDocuments({
      role: "warden",
      createdAt: { $gte: lastMonth },
    }),

    Student.countDocuments({
      createdAt: { $gte: lastMonth },
    }),

    Organization.countDocuments({
      createdAt: { $gte: lastMonth },
    }),

    Hostel.countDocuments({
      createdAt: { $gte: lastMonth },
    }),
  ]);

  return sendSuccess(
    res,
    200,
    "Dashboard stats fetched successfully",
    {
      data: {
        organizations,
        admins,
        wardens,
        students,
        hostels,

        organizationLastMonthCount,
        adminLastMonthCount,
        wardenLastMonthCount,
        studentLastMonthCount,
        hostelLastMonthCount,
      },
    }
  );
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
  const admin = await User.findById(req.user.id)
    .select("organization")
    .lean();

  if (!admin?.organization) {
    return sendError(
      res,
      400,
      "Admin is not assigned to any organization"
    );
  }

  const organizationId = admin.organization;
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);

  const [
    wardens,
    students,
    hostels,
    wardenLastMonthCount,
    studentLastMonthCount,
    hostelLastMonthCount,
  ] = await Promise.all([
    User.countDocuments({
      role: "warden",
      organization: organizationId,
    }),

    Student.countDocuments({
      organizationId,
    }),

    hostelModel.countDocuments({
      organizations: organizationId,
    }),

    User.countDocuments({
      role: "warden",
      organization: organizationId,
      createdAt: { $gte: lastMonth },
    }),

    Student.countDocuments({
      organizationId,
      createdAt: { $gte: lastMonth },
    }),

    hostelModel.countDocuments({
      organizations: organizationId,
      createdAt: { $gte: lastMonth },
    }),
  ]);

  return sendSuccess(
    res,
    200,
    "Dashboard stats fetched successfully",
    {
      data: {
        wardens,
        students,
        hostels,
        wardenLastMonthCount,
        studentLastMonthCount,
        hostelLastMonthCount,
      },
    }
  );
});


export {
  getSuperAdminStats,
  getStudentCountByOrganization,
  getAdminStats,
};
