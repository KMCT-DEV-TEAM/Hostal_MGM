import mongoose from "mongoose";
import FurnitureAsset from "./furnitureAsset.model.js";
import FurnitureType from "./furnitureType.model.js";
import Student from "../students/student.model.js";
import { checkAnyAssetAllocatedForTypeDb } from "./furniture.service.js";

export const validateCreateFurnitureType = async (req, res, next) => {
  try {
    const { name, prefix, openingStock } = req.body;

    if (!name || name.trim().length < 2 || name.trim().length > 100) {
      return res.status(400).json({ success: false, message: "Name must be between 2 and 100 characters." });
    }

    if (!prefix || prefix.trim().length > 10 || /\s/.test(prefix.trim())) {
      return res.status(400).json({ success: false, message: "Prefix must be up to 10 characters without spaces." });
    }

    if (openingStock !== undefined) {
      if (typeof openingStock !== "number" || openingStock < 0 || openingStock > 10000) {
        return res.status(400).json({ success: false, message: "Opening stock must be between 0 and 10000." });
      }
    }

    next();
  } catch (error) {
    return res.status(500).json({ success: false, message: "Validation Error", error: error.message });
  }
};

export const validateUpdateFurnitureType = async (req, res, next) => {
  try {
    const { typeId: id } = req.params;
    const { prefix } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid Furniture Type ID." });
    }

    if (prefix) {
      if (prefix.trim().length > 10 || /\s/.test(prefix.trim())) {
        return res.status(400).json({ success: false, message: "Prefix must be up to 10 characters without spaces." });
      }

      const existingType = await FurnitureType.findById(id).lean();
      if (!existingType) {
        return res.status(404).json({ success: false, message: "Furniture Type Not Found" });
      }

      if (existingType.prefix !== prefix) {
        const hasAllocatedAssets = await checkAnyAssetAllocatedForTypeDb(id);
        if (hasAllocatedAssets) {
          return res.status(409).json({ success: false, message: "Furniture prefix cannot be updated because allocated assets exist." });
        }
      }
    }
    next();
  } catch (error) {
    return res.status(500).json({ success: false, message: "Validation Error", error: error.message });
  }
};

export const validateAdjustAssetCount = async (req, res, next) => {
  try {
    const { typeId } = req.params;
    const { count } = req.body;

    if (!mongoose.Types.ObjectId.isValid(typeId)) {
      return res.status(400).json({ success: false, message: "Invalid Furniture Type ID." });
    }

    if (count === undefined || typeof count !== "number" || count < 0 || !Number.isInteger(count)) {
      return res.status(400).json({ success: false, message: "Count must be a positive integer." });
    }

    next();
  } catch (error) {
    return res.status(500).json({ success: false, message: "Validation Error", error: error.message });
  }
};

export const validateAllocate = async (req, res, next) => {
  try {
    const { studentId, assetId } = req.params;
    console.log(req.params)
    if (!mongoose.Types.ObjectId.isValid(studentId) || !mongoose.Types.ObjectId.isValid(assetId)) {
      return res.status(400).json({ success: false, message: "Invalid ID parameters." });
    }

    const asset = await FurnitureAsset.findById(assetId).populate("furnitureTypeId").lean();
    if (!asset) {
      return res.status(404).json({ success: false, message: "Furniture Asset Not Found" });
    }

    if (asset.status === "Inactive") {
      return res.status(409).json({ success: false, message: "Furniture asset is inactive and must be restored before allocation." });
    }

    if (asset.status !== "Available") {
      return res.status(409).json({ success: false, message: `Furniture is not available. Current status: ${asset.status}` });
    }

    if (asset.studentId) {
      return res.status(409).json({ success: false, message: "Asset is already allocated." });
    }

    const student = await Student.findById(studentId).lean();
    if (!student) {
      return res.status(404).json({ success: false, message: "Student Not Found" });
    }

    if (!student.isActive) {
      return res.status(400).json({ success: false, message: "Student is inactive." });
    }

    if (String(asset.furnitureTypeId.hostelId) !== String(student.hostelId)) {
      return res.status(403).json({ success: false, message: "Student belongs to another hostel." });
    }

    req.validatedData = { asset, student };
    next();
  } catch (error) {
    return res.status(500).json({ success: false, message: "Validation Error", error: error.message });
  }
};

export const validateReturn = async (req, res, next) => {
  try {
    const { studentId, assetId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(studentId) || !mongoose.Types.ObjectId.isValid(assetId)) {
      return res.status(400).json({ success: false, message: "Invalid ID parameters." });
    }

    const asset = await FurnitureAsset.findById(assetId).lean();
    if (!asset) {
      return res.status(404).json({ success: false, message: "Furniture Asset Not Found" });
    }

    if (asset.status !== "Allocated") {
      return res.status(409).json({ success: false, message: "Asset is not currently allocated." });
    }

    if (String(asset.studentId) !== String(studentId)) {
      return res.status(403).json({ success: false, message: "Asset does not belong to this student." });
    }

    req.validatedData = { asset };
    next();
  } catch (error) {
    return res.status(500).json({ success: false, message: "Validation Error", error: error.message });
  }
};

export const validateStatusChange = (allowedCurrentStatuses) => {
  return async (req, res, next) => {
    try {
      const { assetId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(assetId)) {
        return res.status(400).json({ success: false, message: "Invalid Asset ID." });
      }

      const asset = await FurnitureAsset.findById(assetId).lean();
      if (!asset) {
        return res.status(404).json({ success: false, message: "Furniture Asset Not Found" });
      }

      if (!allowedCurrentStatuses.includes(asset.status)) {
        return res.status(409).json({
          success: false,
          message: `Action not allowed. Current status is ${asset.status}, expected one of: ${allowedCurrentStatuses.join(", ")}`
        });
      }

      req.validatedData = { asset };
      next();
    } catch (error) {
      return res.status(500).json({ success: false, message: "Validation Error", error: error.message });
    }
  };
};

export const validateStartMaintenance = validateStatusChange(["Available"]);
export const validateCompleteMaintenance = validateStatusChange(["Maintenance"]);
export const validateMarkLost = validateStatusChange(["Available", "Allocated"]);
export const validateMarkScrap = validateStatusChange(["Available", "Maintenance"]);
