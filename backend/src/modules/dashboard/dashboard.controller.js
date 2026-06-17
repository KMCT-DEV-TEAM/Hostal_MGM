import asyncHandler from "../../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../../utils/response.js";
import User from "../users/user.model.js";
import Organization from "../organizations/organization.model.js";
import Hostel from "../hostels/hostel.model.js";
import Student from "../students/student.model.js";
import Parent from "../parents/parent.model.js";

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
    parents,
    wardenLastMonthCount,
    studentLastMonthCount,
    parentLastMonthCount,
  ] = await Promise.all([
    User.countDocuments({
      role: "warden",
      organization: organizationId,
    }),

    Student.countDocuments({
      organizationId,
    }),

    Parent.aggregate([
      {
        $lookup: {
          from: "students",
          localField: "studentId",
          foreignField: "_id",
          as: "student",
        },
      },
      {
        $unwind: "$student",
      },
      {
        $match: {
          "student.organizationId": organizationId,
        },
      },
      {
        $count: "total",
      },
    ]),

    User.countDocuments({
      role: "warden",
      organization: organizationId,
      createdAt: { $gte: lastMonth },
    }),

    Student.countDocuments({
      organizationId,
      createdAt: { $gte: lastMonth },
    }),

    Parent.aggregate([
      {
        $lookup: {
          from: "students",
          localField: "studentId",
          foreignField: "_id",
          as: "student",
        },
      },
      {
        $unwind: "$student",
      },
      {
        $match: {
          "student.organizationId": organizationId,
          createdAt: { $gte: lastMonth },
        },
      },
      {
        $count: "total",
      },
    ]),
  ]);


  return sendSuccess(
    res,
    200,
    "Dashboard stats fetched successfully",
    {
      data: {
        wardens,
        students,
        parents: parents[0]?.total || 0,
        wardenLastMonthCount,
        studentLastMonthCount,
        parentLastMonthCount: parentLastMonthCount[0]?.total || 0,
      },
    }
  );
});


export {
  getSuperAdminStats,
  getStudentCountByOrganization,
  getAdminStats,
};
