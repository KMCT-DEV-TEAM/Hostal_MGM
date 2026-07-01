import mongoose from "mongoose";

const attendanceWindowSchema = new mongoose.Schema(
  {
    hostelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hostel",
      required: true,
    },
    attendanceDate: {
      type: Date,
      required: true,
    },
    totalStudents: {
      type: Number,
      default: 0,
    },
    scannedCount: {
      type: Number,
      default: 0,
    },
    presentCount: {
      type: Number,
      default: 0,
    },
    absentCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["open", "completed"],
      default: "open",
    },
    startedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Indexes
attendanceWindowSchema.index({ hostelId: 1, attendanceDate: 1 }, { unique: true });
attendanceWindowSchema.index({ hostelId: 1, status: 1, attendanceDate: 1 });
attendanceWindowSchema.index({ status: 1 });
attendanceWindowSchema.index({ attendanceDate: -1 });

const attendanceRecordSchema = new mongoose.Schema(
  {
    attendanceWindowId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AttendanceWindow",
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    hostelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hostel",
      required: true,
    },
    scannedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    scannedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["present", "absent", "late", "on_leave"],
      default: "present",
    },
    remarks: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Indexes
attendanceRecordSchema.index({ attendanceWindowId: 1, studentId: 1 }, { unique: true });
attendanceRecordSchema.index({ attendanceWindowId: 1, status: 1 });
attendanceRecordSchema.index({ attendanceWindowId: 1, scannedAt: -1 });

export const AttendanceWindow = mongoose.model("AttendanceWindow", attendanceWindowSchema);
export const AttendanceRecord = mongoose.model("AttendanceRecord", attendanceRecordSchema);
