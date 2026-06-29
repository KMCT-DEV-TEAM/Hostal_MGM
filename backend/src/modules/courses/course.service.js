import Course from "./course.model.js";
import { updateDepartmentsStatusByQuery } from "../departments/department.service.js";
import { updateStudentsStatusByQuery } from "../students/student.service.js";

const checkExistingCourseCodeDb = async (code) => {
  return await Course.findOne({ code });
};

const createCourseDb = async (data) => {
  return await Course.create(data);
};

const getPaginatedCoursesDb = async (query, skip, limit, sort) => {
  return await Course.find(query)
    .populate("organizationId", "name")
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .select("-__v");
};

const getAllCoursesDb = async (query, sort) => {
  return await Course.find(query).populate("organizationId", "name").sort(sort).select("-__v");
};

const getCourseByIdDb = async (id) => {
  return await Course.findById(id).populate("organizationId", "name").select("-__v");
};

const updateCourseDb = async (id, data) => {
  return await Course.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
};

const updateCoursesStatusByQuery = async (query, isActive) => {
  const courses = await Course.find(query).select("_id");
  const courseIds = courses.map(c => c._id);
  if (courseIds.length > 0) {
    await Course.updateMany({ _id: { $in: courseIds } }, { isActive });
    await updateDepartmentsStatusByQuery({ courseId: { $in: courseIds } }, isActive);
    await updateStudentsStatusByQuery({ courseId: { $in: courseIds } }, isActive);
  }
};

const toggleCourseStatusDb = async (id) => {
  const course = await Course.findById(id);
  if (!course) throw new Error("Course not found");
  
  course.isActive = !course.isActive;
  await course.save();

  await updateDepartmentsStatusByQuery({ courseId: id }, course.isActive);
  await updateStudentsStatusByQuery({ courseId: id }, course.isActive);

  return course;
};

const bulkUpdateCourseStatusDb = async (ids, isActive) => {
  const result = await Course.updateMany(
    { _id: { $in: ids } },
    { $set: { isActive } }
  );

  await updateDepartmentsStatusByQuery({ courseId: { $in: ids } }, isActive);
  await updateStudentsStatusByQuery({ courseId: { $in: ids } }, isActive);

  return result;
};

export {
  checkExistingCourseCodeDb,
  createCourseDb,
  getPaginatedCoursesDb,
  getAllCoursesDb,
  getCourseByIdDb,
  updateCourseDb,
  toggleCourseStatusDb,
  bulkUpdateCourseStatusDb,
  updateCoursesStatusByQuery,
};
