import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
    },
    entityType: {
      type: String,
      required: true,
      enum: ["Organization", "Hostel", "User", "Batch", "Course", "Department", "System"],
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'entityType',
      required: false,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userRole: {
      type: String,
      required: true,
    },
    details: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["success", "error", "warning"],
      default: "success",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster querying
activityLogSchema.index({ entityType: 1, entityId: 1 });
activityLogSchema.index({ user: 1 });
activityLogSchema.index({ status: 1 });
activityLogSchema.index({ createdAt: -1 });

const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);

export default ActivityLog;
