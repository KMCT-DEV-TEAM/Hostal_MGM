import Course from "./course.model.js";

const checkExistingCourseCodeDb = async (code) => {
  return await Course.findOne({ code });
};

const createCourseDb = async (data) => {
  return await Course.create(data);
};

const getPaginatedCoursesDb = async (query, skip, limit, sort) => {
  return await Course.find(query)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .select("-__v");
};

const getAllCoursesDb = async (query, sort) => {
  return await Course.find(query).sort(sort).select("-__v");
};

const getCourseByIdDb = async (id) => {
  return await Course.findById(id).select("-__v");
};

const updateCourseDb = async (id, data) => {
  return await Course.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
};

const toggleCourseStatusDb = async (id) => {
  const course = await Course.findById(id);
  if (!course) throw new Error("Course not found");
  
  course.isActive = !course.isActive;
  await course.save();
  return course;
};

const bulkUpdateCourseStatusDb = async (ids, isActive) => {
  return await Course.updateMany(
    { _id: { $in: ids } },
    { $set: { isActive } }
  );
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
};
