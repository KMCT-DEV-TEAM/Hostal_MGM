import mongoose from "mongoose";

const furnitureAssetSchema = new mongoose.Schema(
  {
    furnitureId: {
      type: String,
      required: true,
      unique: true,
    },
    furnitureTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FurnitureType",
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      default: null,
    },
    status: {
      type: String,
      enum: ["available", "allocated", "maintenance", "inactive", "lost", "scrap"],
      default: "available",
      required: true,
    },
    remarks: {
      type: String,
      maxlength: 1000,
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

furnitureAssetSchema.index({ status: 1 });
furnitureAssetSchema.index({ studentId: 1 });
furnitureAssetSchema.index({ furnitureTypeId: 1 });
furnitureAssetSchema.index({ createdAt: 1 });

furnitureAssetSchema.index({ status: 1, studentId: 1 });

const FurnitureAsset = mongoose.model("FurnitureAsset", furnitureAssetSchema);

export default FurnitureAsset;
