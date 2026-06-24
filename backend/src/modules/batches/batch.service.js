import Batch from "./batch.model.js";
import Department from "../departments/department.model.js";
import Course from "../courses/course.model.js";
import { deactivateStudentsByQuery } from "../students/student.service.js";

const checkExistingBatchCodeDb = async (code) => {
  return await Batch.findOne({ code });
};

const createBatchDb = async (data) => {
  const batch = await Batch.create(data);
  if (batch.departmentId) {
    const dept = await Department.findByIdAndUpdate(batch.departmentId, { $inc: { batchesCount: 1 } });
    if (dept && dept.courseId) {
      await Course.findByIdAndUpdate(dept.courseId, { $inc: { batchesCount: 1 } });
    }
  }
  return batch;
};

const getPaginatedBatchesDb = async (query, skip, limit, sort) => {
  return await Batch.find(query)
    .populate("departmentId", "name code")
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .select("-__v");
};

const getAllBatchesDb = async (query, sort) => {
  return await Batch.find(query).populate("departmentId", "name code").sort(sort).select("-__v");
};

const getBatchByIdDb = async (id) => {
  return await Batch.findById(id).populate("departmentId", "name code").select("-__v");
};

const updateBatchDb = async (id, data) => {
  const oldBatch = await Batch.findById(id);
  const newBatch = await Batch.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });

  if (oldBatch && oldBatch.departmentId?.toString() !== newBatch.departmentId?.toString()) {
    if (oldBatch.departmentId) {
      const oldDept = await Department.findByIdAndUpdate(oldBatch.departmentId, { $inc: { batchesCount: -1 } });
      if (oldDept && oldDept.courseId) {
        await Course.findByIdAndUpdate(oldDept.courseId, { $inc: { batchesCount: -1 } });
      }
    }
    if (newBatch.departmentId) {
      const newDept = await Department.findByIdAndUpdate(newBatch.departmentId, { $inc: { batchesCount: 1 } });
      if (newDept && newDept.courseId) {
        await Course.findByIdAndUpdate(newDept.courseId, { $inc: { batchesCount: 1 } });
      }
    }
  }
  return newBatch;
};

const toggleBatchStatusDb = async (id) => {
  const batch = await Batch.findById(id);
  if (!batch) throw new Error("Batch not found");
  
  batch.isActive = !batch.isActive;
  await batch.save();

  if (!batch.isActive) {
    await deactivateStudentsByQuery({ batchId: id });
  }

  return batch;
};

const bulkUpdateBatchStatusDb = async (ids, isActive) => {
  const result = await Batch.updateMany(
    { _id: { $in: ids } },
    { $set: { isActive } }
  );

  if (!isActive) {
    await deactivateStudentsByQuery({ batchId: { $in: ids } });
  }

  return result;
};

export {
  checkExistingBatchCodeDb,
  createBatchDb,
  getPaginatedBatchesDb,
  getAllBatchesDb,
  getBatchByIdDb,
  updateBatchDb,
  toggleBatchStatusDb,
  bulkUpdateBatchStatusDb,
};
