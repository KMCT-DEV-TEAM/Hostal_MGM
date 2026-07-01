import Department from "./department.model.js";
import Course from "../courses/course.model.js";
import { updateBatchesStatusByQuery } from "../batches/batch.service.js";
import { updateStudentsStatusByQuery } from "../students/student.service.js";

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
    .populate({
      path: "courseId",
      select: "name code",
      populate: {
        path: "organizationId",
        select: "name code"
      }
    })
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .select("-__v");
};

const getAllDepartmentsDb = async (query, sort) => {
  return await Department.find(query)
    .populate({
      path: "courseId",
      select: "name code",
      populate: {
        path: "organizationId",
        select: "name code"
      }
    })
    .sort(sort)
    .select("-__v");
};

const getDepartmentByIdDb = async (id) => {
  return await Department.findById(id)
    .populate({
      path: "courseId",
      select: "name code",
      populate: {
        path: "organizationId",
        select: "name code"
      }
    })
    .select("-__v");
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

const updateDepartmentsStatusByQuery = async (query, isActive) => {
  const departments = await Department.find(query).select("_id");
  const deptIds = departments.map(d => d._id);
  if (deptIds.length > 0) {
    await Department.updateMany({ _id: { $in: deptIds } }, { isActive });
    await updateBatchesStatusByQuery({ departmentId: { $in: deptIds } }, isActive);
    await updateStudentsStatusByQuery({ departmentId: { $in: deptIds } }, isActive);
  }
};

const toggleDepartmentStatusDb = async (id) => {
  const department = await Department.findById(id);
  if (!department) throw new Error("Department not found");
  
  department.isActive = !department.isActive;
  await department.save();

  await updateBatchesStatusByQuery({ departmentId: id }, department.isActive);
  await updateStudentsStatusByQuery({ departmentId: id }, department.isActive);

  return department;
};

const bulkUpdateDepartmentStatusDb = async (ids, isActive) => {
  const result = await Department.updateMany(
    { _id: { $in: ids } },
    { $set: { isActive } }
  );

  await updateBatchesStatusByQuery({ departmentId: { $in: ids } }, isActive);
  await updateStudentsStatusByQuery({ departmentId: { $in: ids } }, isActive);

  return result;
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
  updateDepartmentsStatusByQuery,
};
