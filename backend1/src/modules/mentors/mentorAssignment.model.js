import mongoose from "mongoose";

const mentorAssignmentSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Organization ID is required"],
      index: true,
    },
    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Mentor (User) ID is required"],
      index: true,
    },
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      required: [true, "Batch ID is required"],
      index: true,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "AssignedBy User ID is required"],
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["active", "transferred", "completed", "cancelled"],
      default: "active",
      required: true,
      index: true,
    },
    remarks: {
      type: String,
      trim: true,
      maxLength: [500, "Remarks cannot exceed 500 characters"],
      default: null,
    },
    endedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

/* ==========================================================================
   INDEXES & CONSTRAINTS
   ========================================================================== */

// 1. Partial Unique Index: Ensures a Batch has AT MOST ONE ACTIVE mentor at any given time.
mentorAssignmentSchema.index(
  { batchId: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "active" },
    name: "unique_active_mentor_per_batch",
  }
);

// 2. Compound Index: Fast lookup for a Mentor's active batches inside an organization
mentorAssignmentSchema.index({ mentorId: 1, status: 1, organizationId: 1 });

// 3. Compound Index: Fast historical query for batch assignment logs
mentorAssignmentSchema.index({ batchId: 1, createdAt: -1 });

const MentorAssignment = mongoose.model("MentorAssignment", mentorAssignmentSchema);

export default MentorAssignment;
