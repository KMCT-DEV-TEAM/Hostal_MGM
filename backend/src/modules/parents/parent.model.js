import mongoose from "mongoose";

const parentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    relationship: {
      type: String,
      required: true,
    },
    address: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Parent = mongoose.model("Parent", parentSchema);

export default Parent;
