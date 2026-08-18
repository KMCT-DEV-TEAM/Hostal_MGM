const validateCreateDepartment = (req, res, next) => {
  const { name, code, courseId } = req.body;

  if (!name || !code || !courseId) {
    return res.status(400).json({ success: false, message: "Department name, code, and courseId are required" });
  }

  next();
};

const validateUpdateDepartment = (req, res, next) => {
  const { name, code, courseId, isActive } = req.body;

  if (!name && !code && !courseId && isActive === undefined) {
    return res.status(400).json({ success: false, message: "At least one field is required to update" });
  }

  next();
};

export { validateCreateDepartment, validateUpdateDepartment };
