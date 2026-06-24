import mongoose from "mongoose";

const timelineSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: [
        "created",
        "updated",
        "parent_approved",
        "parent_rejected",
        "warden_approved",
        "warden_rejected",
        "cancelled",
        "returned",
        "completed",
      ],
      required: true,
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    actorRole: {
      type: String,
      enum: ["student", "parent", "warden", "admin", "super_admin", "system"],
      required: true,
    },
    remarks: {
      type: String,
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const passSchema = new mongoose.Schema(
  {
    // --- Basic Information ---
    hostelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hostel",
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Parent",
      required: true,
    },
    passType: {
      type: String,
      enum: ["home_pass", "out_pass"],
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },

    // --- Home Pass Fields ---
    fromDate: { type: Date },
    toDate: { type: Date },
    totalDays: { type: Number },

    date: { type: Date },
    outTime: { type: String },
    expectedReturnTime: { type: String },

    // --- Status Management ---
    status: {
      type: String,
      enum: [
        "pending_parent",
        "pending_warden",
        "approved",
        "rejected",
        "cancelled",
        "returned",
        "completed",
      ],
      default: "pending_parent",
    },

    // --- Parent Approval Tracking ---
    parentApproval: {
      status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
      actionBy: { type: mongoose.Schema.Types.ObjectId, ref: "Parent" },
      actionAt: { type: Date },
      remarks: { type: String, trim: true },
    },

    // --- Warden Approval Tracking ---
    wardenApproval: {
      status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
      actionBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      actionAt: { type: Date },
      remarks: { type: String, trim: true },
    },

    // --- Return Tracking ---
    returnTracking: {
      leftHostelAt: { type: Date },
      returnedAt: { type: Date },
      markedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      returnStatus: { type: String, enum: ["pending", "on_time", "late"], default: "pending" },
    },

    // --- Embedded Timeline ---
    timeline: [timelineSchema],
  },
  {
    timestamps: true,
  }
);

// Indexes
passSchema.index({ studentId: 1, createdAt: -1 });
passSchema.index({ hostelId: 1, status: 1 });
passSchema.index({ "wardenApproval.status": 1, hostelId: 1 });
passSchema.index({ passType: 1, status: 1 });

const Pass = mongoose.model("Pass", passSchema);
export default Pass;
