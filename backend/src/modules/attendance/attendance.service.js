import mongoose from "mongoose";
import { AttendanceWindow, AttendanceRecord } from "./attendance.model.js";
import Student from "../students/student.model.js";
import Hostel from "../hostels/hostel.model.js";
import Pass from "../passes/pass.model.js";
import { formatTime, formatDate, capitalize } from "../../utils/formatters.js";

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
    return {
      _id: existingWindow._id,
      hostelId: existingWindow.hostelId,
      attendanceDate: existingWindow.attendanceDate,
      totalStudents: existingWindow.totalStudents,
      status: existingWindow.status,
      startedAt: existingWindow.createdAt
    };
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

  return {
    _id: newWindow._id,
    hostelId: newWindow.hostelId,
    attendanceDate: newWindow.attendanceDate,
    totalStudents: newWindow.totalStudents,
    status: newWindow.status,
    startedAt: newWindow.createdAt
  };
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
  } else if (query.fromDate || query.toDate) {
    filter.attendanceDate = {};
    if (query.fromDate) filter.attendanceDate.$gte = getStartOfDay(query.fromDate);
    if (query.toDate) filter.attendanceDate.$lte = new Date(new Date(query.toDate).setHours(23, 59, 59, 999));
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

export const getDashboardStatsDb = async (dateStr, scope) => {
  const filter = {};

  if (scope.role === "warden") {
    filter.hostelId = new mongoose.Types.ObjectId(scope.hostelId);
  }

  const queryDate = getStartOfDay(dateStr || new Date());
  filter.attendanceDate = queryDate;

  const result = await AttendanceWindow.aggregate([
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
      $group: {
        _id: null,
        totalStudents: { $sum: "$totalStudents" },
        presentToday: { $sum: "$presentCount" },
        absentToday: { $sum: "$absentCount" },
        windowId: { $first: "$_id" },
        windowStatus: { $first: "$status" },
        windowStartedAt: { $first: "$createdAt" },
        windowStartedByName: { $first: "$startedByInfo.name" }
      }
    }
  ]);

  if (result.length === 0) {
    return {
      totalStudents: 0,
      presentToday: 0,
      absentToday: 0,
      windowStatus: null,
      windowStartedAt: null,
      windowStartedByName: null
    };
  }

  return {
    totalStudents: result[0].totalStudents,
    presentToday: result[0].presentToday,
    absentToday: result[0].absentToday,
    windowId: result[0].windowId,
    windowStatus: result[0].windowStatus,
    windowStartedAt: result[0].windowStartedAt,
    windowStartedByName: result[0].windowStartedByName
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

  // Get the window to find its hostelId
  const window = await AttendanceWindow.findById(windowId).select("hostelId");
  let totalStudentsCount = 0;
  if (window && window.hostelId) {
    totalStudentsCount = await Student.countDocuments({ hostelId: window.hostelId, isActive: true });
  }

  if (query.status) {
    filter.status = query.status;
  }

  if (query.fromDate || query.toDate) {
    filter.scannedAt = {};
    if (query.fromDate) filter.scannedAt.$gte = new Date(query.fromDate);
    if (query.toDate) filter.scannedAt.$lte = new Date(new Date(query.toDate).setHours(23, 59, 59, 999));
  }

  const pipeline = [
    { $match: filter },
    {
      $lookup: {
        from: "students",
        localField: "studentId",
        foreignField: "_id",
        as: "studentInfo"
      }
    },
    { $unwind: { path: "$studentInfo", preserveNullAndEmptyArrays: true } }
  ];

  const studentMatch = {};
  if (query.search) {
    studentMatch.$or = [
      { "studentInfo.name": { $regex: query.search, $options: "i" } },
      { "studentInfo.studentId": { $regex: query.search, $options: "i" } }
    ];
  }
  if (query.room) {
    studentMatch["studentInfo.roomNo"] = { $regex: query.room, $options: "i" };
  }

  if (Object.keys(studentMatch).length > 0) {
    pipeline.push({ $match: studentMatch });
  }

  pipeline.push(
    { $sort: { scannedAt: -1 } },
    {
      $facet: {
        metadata: [{ $count: "totalRecords" }],
        data: [
          { $skip: skip },
          { $limit: limit },
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
  );

  const result = await AttendanceRecord.aggregate(pipeline);
  const totalRecords = result[0]?.metadata[0]?.totalRecords || 0;

  return {
    records: result[0]?.data || [],
    totalStudentsCount,
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
      .lean()
      .session(session);

    if (!window) {
      throw new Error("Attendance window is closed or does not exist.");
    }

    const hostel = await Hostel.findOne({ _id: window.hostelId, isActive: true })
      .select("_id")
      .lean()
      .session(session);

    if (!hostel) {
      throw new Error("Hostel is inactive or does not exist.");
    }

    const student = await Student.findOne({ _id: studentId, isActive: true, hostelStatus: "active" })
      .select("_id hostelId studentId name profileImage")
      .lean()
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
            studentId: student._id,
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

    const record = newRecord[0];
    return {
      attendance: {
        _id: record._id,
        status: record.status,
        scannedAt: record.scannedAt
      },
      student: {
        _id: student._id,
        studentId: student.studentId,
        name: student.name,
        profileImage: student.profileImage || null
      }
    };
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
    const absentIds = absentStudents.map(s => s._id);
    const onLeavePasses = await Pass.find({
      studentId: { $in: absentIds },
      status: "approved",
      "returnTracking.leftHostelAt": { $ne: null },
      "returnTracking.returnedAt": null
    }).select("studentId").lean();
    const onLeaveSet = new Set(onLeavePasses.map(p => p.studentId.toString()));

    const absentRecords = absentStudents.map(student => ({
      attendanceWindowId: windowId,
      studentId: student._id,
      hostelId: window.hostelId,
      scannedBy: wardenId,
      status: onLeaveSet.has(student._id.toString()) ? "on_leave" : "absent",
      remarks: onLeaveSet.has(student._id.toString())
        ? "Marked as on leave automatically upon window completion."
        : "Marked absent automatically upon window completion."
    }));
    await AttendanceRecord.insertMany(absentRecords);
  }

  window.status = "completed";
  window.completedAt = new Date();
  window.completedBy = wardenId;
  window.absentCount = absentStudents.length;
  await window.save();

  return {
    _id: window._id,
    hostelId: window.hostelId,
    attendanceDate: window.attendanceDate,
    status: window.status,
    totalStudents: window.totalStudents,
    scannedCount: window.scannedCount,
    presentCount: window.presentCount,
    absentCount: window.absentCount,
    completedAt: window.completedAt
  };
};

// --- Shared Student & Parent Aggregations ---

export const getStudentDashboardStatsDb = async (studentId) => {
  const todayStart = getStartOfDay(new Date());

  const todayRecord = await AttendanceRecord.findOne({
    studentId: new mongoose.Types.ObjectId(studentId),
    scannedAt: { $gte: todayStart }
  }).sort({ scannedAt: -1 }).lean();

  let today = null;
  if (todayRecord) {
    today = {
      status: capitalize(todayRecord.status),
      markedAt: formatTime(todayRecord.scannedAt),
      date: formatDate(todayRecord.scannedAt)
    };
  }

  const summaryAgg = await AttendanceRecord.aggregate([
    { $match: { studentId: new mongoose.Types.ObjectId(studentId) } },
    {
      $group: {
        _id: null,
        present: { $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } },
        absent: { $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] } }
      }
    }
  ]);

  let summary = { present: 0, absent: 0, percentage: 0 };
  if (summaryAgg.length > 0) {
    const s = summaryAgg[0];
    const totalCount = s.present + s.absent;
    summary = {
      present: s.present,
      absent: s.absent,
      percentage: totalCount > 0 ? parseFloat(((s.present / totalCount) * 100).toFixed(2)) : 0
    };
  }

  return { today, summary };
};

export const getStudentAttendanceHistoryDb = async (studentId, query) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter = { studentId: new mongoose.Types.ObjectId(studentId) };
  if (query.status) {
    filter.status = query.status.toLowerCase();
  }
  if (query.fromDate || query.toDate) {
    filter.scannedAt = {};
    if (query.fromDate) filter.scannedAt.$gte = getStartOfDay(query.fromDate);
    if (query.toDate) filter.scannedAt.$lte = new Date(new Date(query.toDate).setUTCHours(23, 59, 59, 999));
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
              from: "users",
              localField: "scannedBy",
              foreignField: "_id",
              as: "warden"
            }
          },
          { $unwind: { path: "$warden", preserveNullAndEmptyArrays: true } }
        ]
      }
    }
  ];

  const result = await AttendanceRecord.aggregate(pipeline);
  const totalRecords = result[0]?.metadata[0]?.totalRecords || 0;

  const formattedRecords = (result[0]?.data || []).map(record => ({
    id: record._id,
    date: formatDate(record.scannedAt),
    markedAt: formatTime(record.scannedAt),
    status: capitalize(record.status),
    wardenName: record.warden ? record.warden.name : null
  }));

  return {
    records: formattedRecords,
    pagination: {
      page,
      limit,
      totalRecords,
      totalPages: Math.ceil(totalRecords / limit),
      hasNextPage: page * limit < totalRecords,
      hasPreviousPage: page > 1,
    }
  };
};

export const getStudentAttendanceCalendarDb = async (studentId, month, year) => {
  const m = parseInt(month);
  const y = parseInt(year);
  const startDate = new Date(Date.UTC(y, m - 1, 1));
  const endDate = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));
  const records = await AttendanceRecord.find({
    studentId: new mongoose.Types.ObjectId(studentId),
    scannedAt: { $gte: startDate, $lte: endDate }
  }).select("scannedAt status").lean();

  let present = 0;
  let absent = 0;

  const events = records.map(r => {
    if (r.status === 'present') present++;
    if (r.status === 'absent') absent++;
    return {
      date: formatDate(r.scannedAt),
      status: r.status
    };
  });

  const student = await Student.findById(studentId).select("hostelId").lean();
  let notMarked = 0;
  if (student && student.hostelId) {
    const totalWindows = await AttendanceWindow.countDocuments({
      hostelId: student.hostelId,
      attendanceDate: { $gte: startDate, $lte: endDate },
      status: "completed"
    });
    notMarked = Math.max(0, totalWindows - (present + absent));
  }

  return {
    month: m,
    year: y,
    summary: { present, absent, notMarked },
    events
  };
};

export const getStudentAttendanceDetailsDb = async (studentId, dateStr) => {
  const queryDate = getStartOfDay(dateStr);
  const nextDay = new Date(queryDate);
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);

  const record = await AttendanceRecord.findOne({
    studentId: new mongoose.Types.ObjectId(studentId),
    scannedAt: { $gte: queryDate, $lt: nextDay }
  })
    .populate("scannedBy", "name")
    .lean();

  if (!record) return null;

  return {
    date: formatDate(record.scannedAt),
    status: capitalize(record.status),
    markedAt: formatTime(record.scannedAt),
    attendanceWindow: "Hostel Attendance",
    warden: {
      name: record.scannedBy ? record.scannedBy.name : null
    }
  };
};

// ---------------------------------------------------------------------------
// Manual Attendance Correction
// ---------------------------------------------------------------------------

/**
 * Recalculate and persist window stats from actual AttendanceRecord documents.
 * Called after every correction — never manually inc/dec counters.
 */
const recalculateWindowStats = async (windowId) => {
  const agg = await AttendanceRecord.aggregate([
    { $match: { attendanceWindowId: new mongoose.Types.ObjectId(windowId) } },
    {
      $group: {
        _id: null,
        presentCount:  { $sum: { $cond: [{ $eq: ["$status", "present"] },  1, 0] } },
        absentCount:   { $sum: { $cond: [{ $eq: ["$status", "absent"] },   1, 0] } },
        onLeaveCount:  { $sum: { $cond: [{ $eq: ["$status", "on_leave"] }, 1, 0] } },
        scannedCount:  { $sum: 1 },
      },
    },
  ]);

  const counts = agg[0] || { presentCount: 0, absentCount: 0, onLeaveCount: 0, scannedCount: 0 };

  await AttendanceWindow.updateOne(
    { _id: windowId },
    {
      $set: {
        presentCount:  counts.presentCount,
        absentCount:   counts.absentCount,
        onLeaveCount:  counts.onLeaveCount,
        scannedCount:  counts.scannedCount,
      },
    }
  );

  return counts;
};

/**
 * PATCH /attendance/windows/:windowId/students/:studentId
 * Manual correction of an attendance record by a warden.
 */
export const correctAttendanceDb = async (windowId, studentId, wardenId, wardenHostelId, { status, remarks }) => {
  // ── 1. Fetch attendance window ────────────────────────────────────────────
  const window = await AttendanceWindow.findById(windowId).lean();

  if (!window) {
    const err = new Error("Attendance window not found.");
    err.statusCode = 404;
    throw err;
  }

  // ── 2. Window must belong to the warden's hostel ──────────────────────────
  if (window.hostelId.toString() !== wardenHostelId.toString()) {
    const err = new Error("You are not allowed to modify this attendance window.");
    err.statusCode = 403;
    throw err;
  }

  // ── 3. Window must be open ────────────────────────────────────────────────
  if (window.status !== "open") {
    const err = new Error("Attendance window has already been completed.");
    err.statusCode = 422;
    throw err;
  }

  // ── 4 & 5. Fetch & validate student ──────────────────────────────────────
  const student = await Student.findOne({
    _id: studentId,
    isActive: true,
    hostelStatus: "active",
  })
    .select("_id hostelId name studentId")
    .lean();

  if (!student) {
    const err = new Error("Student is inactive or does not exist.");
    err.statusCode = 422;
    throw err;
  }

  if (student.hostelId.toString() !== wardenHostelId.toString()) {
    const err = new Error("Student does not belong to this hostel.");
    err.statusCode = 422;
    throw err;
  }

  // ── 6. Validate status value ─────────────────────────────────────────────
  const ALLOWED_STATUSES = ["present", "absent", "on_leave"];
  if (!ALLOWED_STATUSES.includes(status)) {
    const err = new Error(`Invalid status. Must be one of: ${ALLOWED_STATUSES.join(", ")}.`);
    err.statusCode = 400;
    throw err;
  }

  // ── Fetch existing record (may not exist) ────────────────────────────────
  const existingRecord = await AttendanceRecord.findOne({
    attendanceWindowId: windowId,
    studentId,
  });

  const currentStatus = existingRecord ? existingRecord.status : null;

  // ── 7. Reject same-status update ─────────────────────────────────────────
  if (currentStatus === status) {
    const label = status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ");
    const err = new Error(`Attendance is already marked as ${label}.`);
    err.statusCode = 409;
    throw err;
  }

  // ── 10. No existing record — only allow present or absent ─────────────────
  if (!existingRecord && !["present", "absent"].includes(status)) {
    const err = new Error("Cannot create an attendance record with this status. Only 'present' or 'absent' are allowed for new records.");
    err.statusCode = 422;
    throw err;
  }

  // ── 8. Remarks validation ─────────────────────────────────────────────────
  // Required for: present→absent, on_leave→present, present→on_leave
  const remarksRequired =
    (currentStatus === "present" && status === "absent") ||
    (currentStatus === "on_leave" && status === "present") ||
    (currentStatus === "present" && status === "on_leave");

  if (remarksRequired) {
    if (!remarks || remarks.trim().length < 5) {
      const err = new Error("Remarks are required for this status change (minimum 5 characters).");
      err.statusCode = 400;
      throw err;
    }
    if (remarks.trim().length > 300) {
      const err = new Error("Remarks must not exceed 300 characters.");
      err.statusCode = 400;
      throw err;
    }
  }

  // ── 9. present → on_leave: verify active approved Home Pass ──────────────
  if (currentStatus === "present" && status === "on_leave") {
    const activePass = await Pass.findOne({
      studentId,
      status: "approved",
      "returnTracking.leftHostelAt": { $ne: null, $exists: true },
      "returnTracking.returnedAt": null,
    }).lean();

    if (!activePass) {
      const err = new Error("Student does not have an active approved leave.");
      err.statusCode = 422;
      throw err;
    }
  }

  // ── Persist the correction ────────────────────────────────────────────────
  const historyEntry = {
    previousStatus: currentStatus,
    newStatus: status,
    remarks: remarks ? remarks.trim() : null,
    wardenId,
    changedAt: new Date(),
  };

  let updatedRecord;

  if (existingRecord) {
    // Update existing record
    existingRecord.status = status;
    if (remarks) existingRecord.remarks = remarks.trim();
    existingRecord.correctionHistory.push(historyEntry);
    updatedRecord = await existingRecord.save();
  } else {
    // Create new record (only present/absent — already validated above)
    updatedRecord = await AttendanceRecord.create({
      attendanceWindowId: windowId,
      studentId,
      hostelId: wardenHostelId,
      scannedBy: wardenId,
      status,
      remarks: remarks ? remarks.trim() : undefined,
      correctionHistory: [historyEntry],
    });
  }

  // ── Recalculate window stats ──────────────────────────────────────────────
  const updatedCounts = await recalculateWindowStats(windowId);

  return {
    record: {
      _id: updatedRecord._id,
      status: updatedRecord.status,
      remarks: updatedRecord.remarks,
      correctionHistory: updatedRecord.correctionHistory,
    },
    student: {
      _id: student._id,
      studentId: student.studentId,
      name: student.name,
    },
    windowStats: updatedCounts,
  };
};

