import mongoose from "mongoose";

const furnitureAssetHistorySchema = new mongoose.Schema(
  {
    furnitureAssetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FurnitureAsset",
      required: true,
    },
    action: {
      type: String,
      enum: [
        "created",
        "allocated",
        "returned",
        "maintenance started",
        "maintenance completed",
        "lost",
        "scrapped",
        "deleted",
        "updated",
        "remarks updated",
        "inventory reduced",
        "inventory increased",
        "restored",
      ],
      required: true,
    },
    previousStatus: {
      type: String,
      enum: ["available", "allocated", "maintenance", "inactive", "lost", "scrap"],
    },
    currentStatus: {
      type: String,
      enum: ["available", "allocated", "maintenance", "inactive", "lost", "scrap", "deleted"],
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    performedByRole: {
      type: String,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
    },
    remarks: {
      type: String,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

furnitureAssetHistorySchema.index({ furnitureAssetId: 1 });
furnitureAssetHistorySchema.index({ action: 1 });
furnitureAssetHistorySchema.index({ createdAt: 1 });
furnitureAssetHistorySchema.index({ performedBy: 1 });

furnitureAssetHistorySchema.index({ furnitureAssetId: 1, createdAt: 1 });

const FurnitureAssetHistory = mongoose.model("FurnitureAssetHistory", furnitureAssetHistorySchema);

export default FurnitureAssetHistory;
