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
  const { name, phone } = req.body;

  if (!name && !phone) {
    return res.status(400).json({
      success: false,
      message: "At least one field (name or phone) must be provided for update",
    });
  }

  next();
};

const validateUpdateAdminEmail = (req, res, next) => {
  const { oldEmail, newEmail } = req.body;

  if (!oldEmail || !newEmail) {
    return res.status(400).json({
      success: false,
      message: "oldEmail and newEmail are required",
    });
  }

  next();
};

const validateUpdateAdminOrganization = (req, res, next) => {
  const { organizationId } = req.body;

  if (!organizationId) {
    return res.status(400).json({
      success: false,
      message: "organizationId is required",
    });
  }

  if (!mongoose.Types.ObjectId.isValid(organizationId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid organizationId",
    });
  }

  next();
};

// --- WARDEN VALIDATIONS ---

const validateCreateWarden = (req, res, next) => {
  const { name, email, phone, hostelId } = req.body;

  if (!name || !email || !phone || !hostelId) {
    return res.status(400).json({
      success: false,
      message: "name, email, phone, and hostelId are required",
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
  const { name, phone } = req.body;

  if (!name && !phone) {
    return res.status(400).json({
      success: false,
      message: "At least one field (name or phone) must be provided for update",
    });
  }

  next();
};

export {
  validateCreateAdmin,
  validateAdminIdParam,
  validateUpdateAdmin,
  validateUpdateAdminEmail,
  validateUpdateAdminOrganization,
  validateCreateWarden,
  validateWardenIdParam,
  validateUpdateWarden
}
