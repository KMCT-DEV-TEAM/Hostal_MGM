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
        "Created",
        "Allocated",
        "Returned",
        "Maintenance Started",
        "Maintenance Completed",
        "Lost",
        "Scrapped",
        "Deleted",
        "Updated",
        "Remarks Updated",
        "Inventory Reduced",
        "Inventory Increased",
        "Restored",
      ],
      required: true,
    },
    previousStatus: {
      type: String,
      enum: ["Available", "Allocated", "Maintenance", "Inactive", "Lost", "Scrap"],
    },
    currentStatus: {
      type: String,
      enum: ["Available", "Allocated", "Maintenance", "Inactive", "Lost", "Scrap", "Deleted"],
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
