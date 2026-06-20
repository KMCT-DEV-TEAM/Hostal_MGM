import Department from "./department.model.js";
import Course from "../courses/course.model.js";

const checkExistingDepartmentCodeDb = async (code) => {
  return await Department.findOne({ code });
};

const createDepartmentDb = async (data) => {
  const dept = await Department.create(data);
  if (dept.courseId) {
    await Course.findByIdAndUpdate(dept.courseId, { $inc: { departmentsCount: 1 } });
  }
  return dept;
};

const getPaginatedDepartmentsDb = async (query, skip, limit, sort) => {
  return await Department.find(query)
    .populate("courseId", "name code")
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .select("-__v");
};

const getAllDepartmentsDb = async (query, sort) => {
  return await Department.find(query).populate("courseId", "name code").sort(sort).select("-__v");
};

const getDepartmentByIdDb = async (id) => {
  return await Department.findById(id).populate("courseId", "name code").select("-__v");
};

const updateDepartmentDb = async (id, data) => {
  const oldDept = await Department.findById(id);
  const newDept = await Department.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });

  if (oldDept && oldDept.courseId?.toString() !== newDept.courseId?.toString()) {
    if (oldDept.courseId) {
      await Course.findByIdAndUpdate(oldDept.courseId, { 
        $inc: { 
          departmentsCount: -1,
          batchesCount: -(oldDept.batchesCount || 0)
        } 
      });
    }
    if (newDept.courseId) {
      await Course.findByIdAndUpdate(newDept.courseId, { 
        $inc: { 
          departmentsCount: 1,
          batchesCount: newDept.batchesCount || 0
        } 
      });
    }
  }
  return newDept;
};

const toggleDepartmentStatusDb = async (id) => {
  const department = await Department.findById(id);
  if (!department) throw new Error("Department not found");
  
  department.isActive = !department.isActive;
  await department.save();
  return department;
};

const bulkUpdateDepartmentStatusDb = async (ids, isActive) => {
  return await Department.updateMany(
    { _id: { $in: ids } },
    { $set: { isActive } }
  );
};

export {
  checkExistingDepartmentCodeDb,
  createDepartmentDb,
  getPaginatedDepartmentsDb,
  getAllDepartmentsDb,
  getDepartmentByIdDb,
  updateDepartmentDb,
  toggleDepartmentStatusDb,
  bulkUpdateDepartmentStatusDb,
};

