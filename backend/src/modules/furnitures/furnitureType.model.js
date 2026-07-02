import mongoose from "mongoose";

const furnitureTypeSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    hostelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hostel",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    prefix: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      maxlength: 10,
    },
    description: {
      type: String,
      maxlength: 500,
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

furnitureTypeSchema.index({ organizationId: 1 });
furnitureTypeSchema.index({ hostelId: 1 });
furnitureTypeSchema.index({ isActive: 1 });

furnitureTypeSchema.index(
  { organizationId: 1, hostelId: 1, name: 1 },
  { unique: true }
);

furnitureTypeSchema.index(
  { organizationId: 1, hostelId: 1, prefix: 1 },
  { unique: true }
);

const FurnitureType = mongoose.model("FurnitureType", furnitureTypeSchema);

export default FurnitureType;
