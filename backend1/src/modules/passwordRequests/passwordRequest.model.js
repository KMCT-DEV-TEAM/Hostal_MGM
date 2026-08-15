import mongoose from "mongoose";

const passwordRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    newPassword: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

const PasswordRequest = mongoose.model("PasswordRequest", passwordRequestSchema);
export default PasswordRequest;
