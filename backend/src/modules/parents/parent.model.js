import mongoose from "mongoose";

const parentSchema = new mongoose.Schema(
  {
    parentName: {
      type: String,
      required: true,
      trim: true,
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
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
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

parentSchema.index({ phone: 1 }, { unique: true });
parentSchema.index({ email: 1 }, { unique: true, sparse: true, background: true });


parentSchema.set("toJSON", {
  transform(doc, ret) {
    delete ret.password;
    return ret;
  },
});

parentSchema.set("toObject", {
  transform(doc, ret) {
    delete ret.password;
    return ret;
  },
});
const Parent = mongoose.model("Parent", parentSchema);
export default Parent;
