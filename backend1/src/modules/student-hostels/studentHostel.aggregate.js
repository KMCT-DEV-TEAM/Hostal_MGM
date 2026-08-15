import mongoose from "mongoose";
import StudentHostelAllocation from "./studentHostel.model.js";

export const getHostelHistoryAggregate = async (query) => {
  const {
    page = 1,
    limit = 10,
    search = "",
    hostelId,
    organizationId,
    status,
    sortBy = "joinedAt",
    sortOrder = "desc",
  } = query;

  const pageNumber = Number(page);
  const limitNumber = Number(limit);
  const skip = (pageNumber - 1) * limitNumber;

  const matchStage = {};

  if (organizationId && mongoose.Types.ObjectId.isValid(organizationId)) {
    matchStage.organizationId = new mongoose.Types.ObjectId(organizationId);
  }

  if (hostelId && mongoose.Types.ObjectId.isValid(hostelId)) {
    matchStage.hostelId = new mongoose.Types.ObjectId(hostelId);
  }

  if (status) {
    matchStage.status = status;
  }

  const pipeline = [
    { $match: matchStage },
    {
      $lookup: {
        from: "students",
        localField: "studentId",
        foreignField: "_id",
        as: "student",
      },
    },
    { $unwind: { path: "$student", preserveNullAndEmptyArrays: true } },
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
      $lookup: {
        from: "organizations",
        localField: "organizationId",
        foreignField: "_id",
        as: "organization",
      },
    },
    { $unwind: { path: "$organization", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "users",
        localField: "allocatedBy",
        foreignField: "_id",
        as: "allocatedByUser",
      },
    },
    { $unwind: { path: "$allocatedByUser", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "users",
        localField: "vacatedBy",
        foreignField: "_id",
        as: "vacatedByUser",
      },
    },
    { $unwind: { path: "$vacatedByUser", preserveNullAndEmptyArrays: true } },
  ];

  if (search) {
    pipeline.push({
      $match: {
        $or: [
          { "student.name": { $regex: search, $options: "i" } },
          { "student.studentId": { $regex: search, $options: "i" } },
          { "hostel.name": { $regex: search, $options: "i" } },
          { roomNumber: { $regex: search, $options: "i" } },
        ],
      },
    });
  }

  pipeline.push({
    $project: {
      _id: 1,
      roomNumber: 1,
      status: 1,
      joinedAt: 1,
      vacatedAt: 1,
      reason: 1,
      remarks: 1,
      student: {
        _id: "$student._id",
        name: "$student.name",
        studentId: "$student.studentId",
        email: "$student.email",
      },
      hostel: {
        _id: "$hostel._id",
        name: "$hostel.name",
        code: "$hostel.code",
      },
      organization: {
        _id: "$organization._id",
        name: "$organization.name",
        code: "$organization.code",
      },
      allocatedBy: {
        _id: "$allocatedByUser._id",
        name: "$allocatedByUser.name",
      },
      vacatedBy: {
        _id: "$vacatedByUser._id",
        name: "$vacatedByUser.name",
      },
    },
  });

  const sortStage = {};
  sortStage[sortBy] = sortOrder === "asc" ? 1 : -1;
  pipeline.push({ $sort: sortStage });

  const history = await StudentHostelAllocation.aggregate([
    ...pipeline,
    { $skip: skip },
    { $limit: limitNumber },
  ]);

  const totalResult = await StudentHostelAllocation.aggregate([
    ...pipeline,
    { $count: "total" },
  ]);

  const totalRecords = totalResult[0]?.total || 0;

  return {
    history,
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

export const getStudentHostelTimelineDb = async (studentId) => {
  return await StudentHostelAllocation.find({ studentId })
    .populate("hostelId", "name code")
    .populate("allocatedBy", "name")
    .populate("vacatedBy", "name")
    .sort({ joinedAt: -1 })
    .lean();
};
