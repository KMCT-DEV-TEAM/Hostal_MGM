import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    phone: {
      type: String,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: [
        "super_admin",
        "admin",
        "warden",
        "student",
        "parent",
        "maintenance_staff"
      ],
      default: "student",
    },

    specialization: {
      type: String,
    },

    assignedTask: {
      type: String,
    },

    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    temppass: {
      type: Boolean,
      default: false,
    },

    settings: {
      notifications: {
        emailAlerts: { type: Boolean, default: true },
        smsAlerts: { type: Boolean, default: false },
        pushAlerts: { type: Boolean, default: true },
        inAppAlerts: { type: Boolean, default: true }
      },
      preferences: {
        theme: { type: String, default: "light" },
        language: { type: String, default: "en" }
      }
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

export default User;