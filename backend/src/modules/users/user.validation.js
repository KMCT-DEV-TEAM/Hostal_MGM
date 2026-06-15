import mongoose from "mongoose";

// --- ADMIN VALIDATIONS ---

const validateCreateAdmin = (req, res, next) => {
  const { name, email, organizationId } = req.body;

  if (!name || !email || !organizationId) {
    return res.status(400).json({
      success: false,
      message: "name, email, and organizationId are required",
    });
  }

  next();
};

const validateAdminIdParam = (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Admin ID",
    });
  }

  next();
};

const validateUpdateAdmin = (req, res, next) => {
  const { name, email } = req.body;

  if (!name && !email) {
    return res.status(400).json({
      success: false,
      message: "At least one field (name or email) must be provided for update",
    });
  }

  next();
};

// --- WARDEN VALIDATIONS ---

const validateCreateWarden = (req, res, next) => {
  const { name, email, password, organizationId, hostelId } = req.body;

  if (!name || !email || !password || !organizationId || !hostelId) {
    return res.status(400).json({
      success: false,
      message: "name, email, password, organizationId, and hostelId are required",
    });
  }

  if (!mongoose.Types.ObjectId.isValid(hostelId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Hostel ID",
    });
  }

  next();
};

const validateWardenIdParam = (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Warden ID",
    });
  }

  next();
};

const validateUpdateWarden = (req, res, next) => {
  const { name, email } = req.body;

  if (!name && !email) {
    return res.status(400).json({
      success: false,
      message: "At least one field (name or email) must be provided for update",
    });
  }

  next();
};

export {
  validateCreateAdmin,
  validateAdminIdParam,
  validateUpdateAdmin,
  validateCreateWarden,
  validateWardenIdParam,
  validateUpdateWarden
}
