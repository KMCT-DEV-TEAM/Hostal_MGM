import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    creatorRole: {
      type: String,
      enum: ["super_admin", "admin", "warden"],
      required: true,
    },
    targetType: {
      type: String,
      enum: ["general", "organization", "hostel"],
      required: true,
    },
    targetOrganizations: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
      },
    ],
    targetHostels: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Hostel",
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Announcement", announcementSchema);
