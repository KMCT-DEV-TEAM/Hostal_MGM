import mongoose from "mongoose";

const parentSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    parentName: {
      type: String,
      required: true,
      trim: true,
    },

    relationship: {
      type: String,
      required: true,
      enum: ["father", "mother", "guardian", "other"],
    },
    phone: {
      type: String,
      required: true,
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
    defaultGuardian : {
      type :Boolean,
      default : false
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

parentSchema.index({ studentId: 1 });

const Parent = mongoose.model("Parent", parentSchema);
export default Parent;
