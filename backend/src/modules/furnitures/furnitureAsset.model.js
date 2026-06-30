import mongoose from "mongoose";

const furnitureAssetSchema = new mongoose.Schema(
  {
    furnitureId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    furnitureTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FurnitureType",
      required: true,
    },
    hostelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hostel",
      default: null
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      default: null,
    },
    status: {
      type: String,
      enum: ["Available", "Allocated", "Maintenance", "Lost", "Scrap"],
      required: true,
      default: "Available",
    },
    remarks: {
      type: String,
      trim: true,
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
furnitureAssetSchema.index({ furnitureId: 1 });
furnitureAssetSchema.index({ furnitureTypeId: 1 });

const FurnitureAsset = mongoose.model("FurnitureAsset", furnitureAssetSchema);
export default FurnitureAsset;
