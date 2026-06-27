import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },

    hostelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hostel",
      default: null,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    tempPassword: {
      type: Boolean,
      default: false
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: true,
    },

    dob: {
      type: Date,
    },

    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      default: null,
    },

    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },

    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      default: null,
    },

    academicYear: {
      type: String,
      trim: true,
    },

    address: {
      type: String,
      trim: true,
    },

    hostelStatus: {
      type: String,
      enum: ["active", "inactive"],
      default: "inactive",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    joiningDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

studentSchema.index({ organizationId: 1 });
studentSchema.index({ hostelId: 1 });
studentSchema.index({ hostelId: 1, organizationId: 1 });
studentSchema.index({ hostelId: 1, isActive: 1, hostelStatus: 1 });
studentSchema.index({ courseId: 1 });
studentSchema.index({ departmentId: 1 });
studentSchema.index({ batchId: 1 });

export default mongoose.model("Student", studentSchema);