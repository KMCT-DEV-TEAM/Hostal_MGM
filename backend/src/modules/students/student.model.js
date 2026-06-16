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

    department: {
      type: String,
      trim: true,
    },

    course: {
      type: String,
      trim: true,
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
      enum: [ "active" , " in_active"], 
      default: "in_active",
    },

    isActive: {
      type: Boolean,
      default: true,
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

studentSchema.index({ studentId: 1 });
studentSchema.index({ organizationId: 1 });
studentSchema.index({ hostelId: 1 });

export default mongoose.model("Student", studentSchema);