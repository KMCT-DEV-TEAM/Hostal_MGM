import {
  checkExistingComplaintCategoryNameDb,
  createComplaintCategoryDb,
  getPaginatedComplaintCategoriesDb,
  getAllComplaintCategoriesDb,
  getComplaintCategoryByIdDb,
  updateComplaintCategoryDb,
  toggleComplaintCategoryStatusDb,
  bulkUpdateComplaintCategoryStatusDb,
} from "./complaintCategory.service.js";
import ComplaintCategory from "./complaintCategory.model.js";

export const createComplaintCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    const existingCategory = await checkExistingComplaintCategoryNameDb(name);
    if (existingCategory) {
      return res.status(400).json({ message: "Complaint Category name already exists" });
    }

    const newCategory = await createComplaintCategoryDb({ name, description });

    res.status(201).json({
      message: "Complaint Category created successfully",
      category: newCategory,
    });
  } catch (error) {
    console.error("Create Complaint Category Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getComplaintCategories = async (req, res) => {
  try {
    const { page, limit, search, status } = req.query;

    const query = {};

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    if (status && status !== "All") {
      query.isActive = status === "Active";
    }

    // If limit is 0 or '0', return all matching items without pagination
    if (limit === "0" || limit === 0) {
      const categories = await getAllComplaintCategoriesDb(query, { createdAt: -1 });
      return res.status(200).json({
        data: categories,
        totalCount: categories.length,
      });
    }

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    const categories = await getPaginatedComplaintCategoriesDb(query, skip, limitNum, { createdAt: -1 });
    const totalCount = await ComplaintCategory.countDocuments(query);

    res.status(200).json({
      data: categories,
      totalCount,
      currentPage: pageNum,
      totalPages: Math.ceil(totalCount / limitNum),
    });
  } catch (error) {
    console.error("Get Complaint Categories Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getComplaintCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await getComplaintCategoryByIdDb(id);

    if (!category) {
      return res.status(404).json({ message: "Complaint Category not found" });
    }

    res.status(200).json(category);
  } catch (error) {
    console.error("Get Complaint Category By ID Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateComplaintCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const existingCategory = await getComplaintCategoryByIdDb(id);
    if (!existingCategory) {
      return res.status(404).json({ message: "Complaint Category not found" });
    }

    if (name && name !== existingCategory.name) {
      const nameTaken = await checkExistingComplaintCategoryNameDb(name);
      if (nameTaken) {
        return res.status(400).json({ message: "Complaint Category name already exists" });
      }
    }

    const updatedCategory = await updateComplaintCategoryDb(id, { name, description });

    res.status(200).json({
      message: "Complaint Category updated successfully",
      category: updatedCategory,
    });
  } catch (error) {
    console.error("Update Complaint Category Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const toggleComplaintCategoryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await toggleComplaintCategoryStatusDb(id);

    res.status(200).json({
      message: `Complaint Category ${category.isActive ? "activated" : "deactivated"} successfully`,
      category,
    });
  } catch (error) {
    console.error("Toggle Complaint Category Status Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const bulkUpdateComplaintCategoryStatus = async (req, res) => {
  try {
    const { ids, isActive } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "Please provide an array of category IDs" });
    }

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ message: "Please provide a valid boolean value for isActive" });
    }

    const result = await bulkUpdateComplaintCategoryStatusDb(ids, isActive);

    res.status(200).json({
      message: `Successfully ${isActive ? 'activated' : 'deactivated'} ${result.modifiedCount} complaint categories`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error("Bulk Update Complaint Category Status Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
