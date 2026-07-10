import mongoose from "mongoose";

const studentHostelAllocationSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    hostelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hostel",
      required: true,
    },
    roomNumber: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "vacated", "transferred", "cancelled"],
      default: "active",
      required: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    vacatedAt: {
      type: Date,
      default: null,
    },
    allocatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    vacatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reason: {
      type: String,
      trim: true,
    },
    remarks: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

studentHostelAllocationSchema.index({ studentId: 1 });
studentHostelAllocationSchema.index({ hostelId: 1 });
studentHostelAllocationSchema.index({ organizationId: 1 });
studentHostelAllocationSchema.index({ status: 1 });
studentHostelAllocationSchema.index({ joinedAt: 1 });

export default mongoose.model("StudentHostelAllocation", studentHostelAllocationSchema);
