import mongoose from "mongoose";

const furnitureTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    prefix: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    description: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
furnitureTypeSchema.index({ name: 1 });
furnitureTypeSchema.index({ prefix: 1 });
furnitureTypeSchema.index({ isActive: 1 });

const FurnitureType = mongoose.model("FurnitureType", furnitureTypeSchema);
export default FurnitureType;
