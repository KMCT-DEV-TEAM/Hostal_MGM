import mongoose from "mongoose";
import { AttendanceWindow, AttendanceRecord } from "./attendance.model.js";
import Student from "../students/student.model.js";

const getStartOfDay = (date) => {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

export const createAttendanceWindowDb = async (hostelId, wardenId) => {
  const today = getStartOfDay(new Date());

  const existingWindow = await AttendanceWindow.findOne({
    hostelId,
    attendanceDate: today,
  });

  if (existingWindow) {
    return existingWindow;
  }

  await AttendanceWindow.updateMany(
    { hostelId, status: "open", attendanceDate: { $lt: today } },
    { $set: { status: "completed", completedAt: new Date(), completedBy: wardenId } }
  );

  const totalStudents = await Student.countDocuments({
    hostelId,
    isActive: true,
    hostelStatus: "active",
  });

  const newWindow = await AttendanceWindow.create({
    hostelId,
    attendanceDate: today,
    totalStudents,
    startedBy: wardenId,
  });

  return newWindow;
};

export const getAttendanceWindowsDb = async (query, scope) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter = {};

  if (scope.role === "warden") {
     filter.hostelId = scope.hostelId;
  } else if (query.hostelId) {
     filter.hostelId = new mongoose.Types.ObjectId(query.hostelId);
  }

  if (query.status) {
    filter.status = query.status;
  }

  if (query.date) {
    filter.attendanceDate = getStartOfDay(query.date);
  } else if (query.month && query.year) {
    const startOfMonth = new Date(Date.UTC(query.year, query.month - 1, 1));
    const endOfMonth = new Date(Date.UTC(query.year, query.month, 0, 23, 59, 59, 999));
    filter.attendanceDate = { $gte: startOfMonth, $lte: endOfMonth };
  }

  const pipeline = [
    { $match: filter },
    { $sort: { attendanceDate: -1 } },
    {
      $facet: {
        metadata: [{ $count: "totalRecords" }],
        data: [
          { $skip: skip },
          { $limit: limit },
          {
            $lookup: {
              from: "users",
              localField: "startedBy",
              foreignField: "_id",
              as: "startedByInfo"
            }
          },
          { $unwind: { path: "$startedByInfo", preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: "users",
              localField: "completedBy",
              foreignField: "_id",
              as: "completedByInfo"
            }
          },
          { $unwind: { path: "$completedByInfo", preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: "hostels",
              localField: "hostelId",
              foreignField: "_id",
              as: "hostelInfo"
            }
          },
          { $unwind: { path: "$hostelInfo", preserveNullAndEmptyArrays: true } },
          {
            $project: {
              _id: 1,
              attendanceDate: 1,
              totalStudents: 1,
              scannedCount: 1,
              presentCount: 1,
              absentCount: 1,
              status: 1,
              startedAt: 1,
              completedAt: 1,
              createdAt: 1,
              hostel: { _id: "$hostelInfo._id", name: "$hostelInfo.name" },
              startedBy: { _id: "$startedByInfo._id", name: "$startedByInfo.name", email: "$startedByInfo.email" },
              completedBy: { _id: "$completedByInfo._id", name: "$completedByInfo.name", email: "$completedByInfo.email" }
            }
          }
        ]
      }
    }
  ];

  const result = await AttendanceWindow.aggregate(pipeline);
  const totalRecords = result[0]?.metadata[0]?.totalRecords || 0;
  
  return {
    windows: result[0]?.data || [],
    pagination: {
      page,
      limit,
      totalRecords,
      totalPages: Math.ceil(totalRecords / limit),
      hasNextPage: page * limit < totalRecords,
      hasPreviousPage: page > 1,
    },
  };
};

export const getAttendanceWindowDetailsDb = async (windowId, scope) => {
  const filter = { _id: new mongoose.Types.ObjectId(windowId) };
  if (scope.role === "warden") {
    filter.hostelId = new mongoose.Types.ObjectId(scope.hostelId);
  }
  
  const pipeline = [
    { $match: filter },
    {
      $lookup: {
        from: "users",
        localField: "startedBy",
        foreignField: "_id",
        as: "startedByInfo"
      }
    },
    { $unwind: { path: "$startedByInfo", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "users",
        localField: "completedBy",
        foreignField: "_id",
        as: "completedByInfo"
      }
    },
    { $unwind: { path: "$completedByInfo", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "hostels",
        localField: "hostelId",
        foreignField: "_id",
        as: "hostelInfo"
      }
    },
    { $unwind: { path: "$hostelInfo", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 1,
        attendanceDate: 1,
        totalStudents: 1,
        scannedCount: 1,
        presentCount: 1,
        absentCount: 1,
        status: 1,
        startedAt: 1,
        completedAt: 1,
        createdAt: 1,
        hostel: { _id: "$hostelInfo._id", name: "$hostelInfo.name" },
        startedBy: { _id: "$startedByInfo._id", name: "$startedByInfo.name", email: "$startedByInfo.email" },
        completedBy: { _id: "$completedByInfo._id", name: "$completedByInfo.name", email: "$completedByInfo.email" }
      }
    }
  ];

  const result = await AttendanceWindow.aggregate(pipeline);
  return result[0] || null;
};

export const getAttendanceRecordsDb = async (windowId, query, scope) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter = { attendanceWindowId: new mongoose.Types.ObjectId(windowId) };
  
  if (query.status) {
    filter.status = query.status;
  }

  const pipeline = [
    { $match: filter },
    { $sort: { scannedAt: -1 } },
    {
      $facet: {
        metadata: [{ $count: "totalRecords" }],
        data: [
          { $skip: skip },
          { $limit: limit },
          {
            $lookup: {
              from: "students",
              localField: "studentId",
              foreignField: "_id",
              as: "studentInfo"
            }
          },
          { $unwind: { path: "$studentInfo", preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: "users",
              localField: "scannedBy",
              foreignField: "_id",
              as: "scannedByInfo"
            }
          },
          { $unwind: { path: "$scannedByInfo", preserveNullAndEmptyArrays: true } },
          {
            $project: {
              _id: 1,
              status: 1,
              scannedAt: 1,
              remarks: 1,
              student: {
                _id: "$studentInfo._id",
                name: "$studentInfo.name",
                studentId: "$studentInfo.studentId",
                room: "$studentInfo.roomNo"
              },
              scannedBy: {
                _id: "$scannedByInfo._id",
                name: "$scannedByInfo.name"
              }
            }
          }
        ]
      }
    }
  ];

  const result = await AttendanceRecord.aggregate(pipeline);
  const totalRecords = result[0]?.metadata[0]?.totalRecords || 0;

  return {
    records: result[0]?.data || [],
    pagination: {
      page,
      limit,
      totalRecords,
      totalPages: Math.ceil(totalRecords / limit),
      hasNextPage: page * limit < totalRecords,
      hasPreviousPage: page > 1,
    },
  };
};

export const scanStudentDb = async (windowId, studentId, wardenId) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const window = await AttendanceWindow.findOne({ _id: windowId, status: "open" })
      .select("_id hostelId")
      .session(session);
      
    if (!window) {
      throw new Error("Attendance window is closed or does not exist.");
    }

    const student = await Student.findOne({ _id: studentId, isActive: true, hostelStatus: "active" })
      .select("_id hostelId")
      .session(session);
      
    if (!student) {
      throw new Error("Student is inactive or does not exist.");
    }
    
    if (student.hostelId.toString() !== window.hostelId.toString()) {
      throw new Error("Student does not belong to this hostel.");
    }

    let newRecord;
    try {
      newRecord = await AttendanceRecord.create(
        [
          {
            attendanceWindowId: windowId,
            studentId: studentId,
            hostelId: window.hostelId,
            scannedBy: wardenId,
            status: "present",
          },
        ],
        { session }
      );
    } catch (err) {
      if (err.code === 11000) {
        throw new Error("Student has already been scanned in this window.");
      }
      throw err;
    }

    await AttendanceWindow.updateOne(
      { _id: windowId },
      { $inc: { scannedCount: 1, presentCount: 1 } },
      { session }
    );

    await session.commitTransaction();
    return newRecord[0];
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const completeAttendanceWindowDb = async (windowId, wardenId) => {
  const window = await AttendanceWindow.findOne({ _id: windowId, status: "open" });
  if (!window) {
    throw new Error("Window is already completed or does not exist.");
  }

  const absentStudents = await Student.aggregate([
    { 
      $match: { 
        hostelId: window.hostelId, 
        isActive: true, 
        hostelStatus: "active" 
      } 
    },
    {
      $lookup: {
        from: "attendancerecords",
        let: { studentId: "$_id" },
        pipeline: [
          { 
            $match: { 
              $expr: { 
                $and: [
                  { $eq: ["$studentId", "$$studentId"] },
                  { $eq: ["$attendanceWindowId", new mongoose.Types.ObjectId(windowId)] }
                ] 
              } 
            } 
          },
          { $project: { _id: 1 } }
        ],
        as: "records"
      }
    },
    { $match: { records: { $size: 0 } } },
    { $project: { _id: 1 } }
  ]);

  if (absentStudents.length > 0) {
    const absentRecords = absentStudents.map(student => ({
      attendanceWindowId: windowId,
      studentId: student._id,
      hostelId: window.hostelId,
      scannedBy: wardenId,
      status: "absent",
      remarks: "Marked absent automatically upon window completion."
    }));
    
    await AttendanceRecord.insertMany(absentRecords);
  }

  window.status = "completed";
  window.completedAt = new Date();
  window.completedBy = wardenId;
  window.absentCount = absentStudents.length;
  await window.save();

  return window;
};
