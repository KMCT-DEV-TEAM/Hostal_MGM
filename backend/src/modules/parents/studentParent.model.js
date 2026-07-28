import mongoose from "mongoose";

const studentParentSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Parent",
      required: true,
      index: true,
    },
    relationship: {
      type: String,
      required: true,
      trim: true,
      enum: ["father", "mother", "guardian", "other"],
      default: "guardian",
    },
    defaultGuardian: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent the same parent from being linked to the same student multiple times
studentParentSchema.index({ parentId: 1, studentId: 1 }, { unique: true });

// Create the model
const StudentParent = mongoose.model("StudentParent", studentParentSchema);

export default StudentParent;
