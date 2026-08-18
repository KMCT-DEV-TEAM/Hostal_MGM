const validateCreateBatch = (req, res, next) => {
  const { name, code, departmentId, startYear, endYear } = req.body;

  if (!name || !code || !departmentId || !startYear || !endYear) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  next();
};

const validateUpdateBatch = (req, res, next) => {
  const { name, code, departmentId, startYear, endYear, isActive } = req.body;

  if (!name && !code && !departmentId && !startYear && !endYear && isActive === undefined) {
    return res.status(400).json({ success: false, message: "At least one field is required to update" });
  }

  next();
};

export { validateCreateBatch, validateUpdateBatch };
