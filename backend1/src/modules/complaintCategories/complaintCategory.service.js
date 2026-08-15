import ComplaintCategory from "./complaintCategory.model.js";

const checkExistingComplaintCategoryNameDb = async (name) => {
  return await ComplaintCategory.findOne({ name });
};

const createComplaintCategoryDb = async (data) => {
  return await ComplaintCategory.create(data);
};

const getPaginatedComplaintCategoriesDb = async (query, skip, limit, sort) => {
  return await ComplaintCategory.find(query)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .select("-__v");
};

const getAllComplaintCategoriesDb = async (query, sort) => {
  return await ComplaintCategory.find(query).sort(sort).select("-__v");
};

const getComplaintCategoryByIdDb = async (id) => {
  return await ComplaintCategory.findById(id).select("-__v");
};

const updateComplaintCategoryDb = async (id, data) => {
  return await ComplaintCategory.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
};

const toggleComplaintCategoryStatusDb = async (id) => {
  const category = await ComplaintCategory.findById(id);
  if (!category) throw new Error("Complaint Category not found");
  
  category.isActive = !category.isActive;
  await category.save();

  return category;
};

const bulkUpdateComplaintCategoryStatusDb = async (ids, isActive) => {
  return await ComplaintCategory.updateMany(
    { _id: { $in: ids } },
    { $set: { isActive } }
  );
};

export {
  checkExistingComplaintCategoryNameDb,
  createComplaintCategoryDb,
  getPaginatedComplaintCategoriesDb,
  getAllComplaintCategoriesDb,
  getComplaintCategoryByIdDb,
  updateComplaintCategoryDb,
  toggleComplaintCategoryStatusDb,
  bulkUpdateComplaintCategoryStatusDb,
};
