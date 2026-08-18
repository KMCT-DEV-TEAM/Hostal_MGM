const validateCreateCourse = (req, res, next) => {
  const { name, code, organizationId } = req.body;

  if (!name || !code) {
    return res.status(400).json({ success: false, message: "Course name and code are required" });
  }

  if (req.user?.role === "super_admin" && !organizationId) {
    return res.status(400).json({ success: false, message: "organizationId is required for super_admin" });
  }

  next();
};

const validateUpdateCourse = (req, res, next) => {
  const { name, code, organizationId, isActive } = req.body;

  if (!name && !code && !organizationId && isActive === undefined) {
    return res.status(400).json({ success: false, message: "At least one field is required to update" });
  }

  next();
};

export { validateCreateCourse, validateUpdateCourse };
