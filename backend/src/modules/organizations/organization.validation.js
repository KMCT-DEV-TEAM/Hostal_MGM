import mongoose from "mongoose";

const validateCreateOrganization = (req, res, next) => {
  const { name, code, organisationNumber } = req.body;

  if (!name || !code || !organisationNumber) {
    return res.status(400).json({
      success: false,
      message: "name, code, and organisationNumber are required",
    });
  }

  next();
};

const validateOrganizationIdParam = (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Organization ID",
    });
  }

  next();
};

const validateUpdateOrganization = (req, res, next) => {
  const { name, code, organisationNumber, email, phone, address } = req.body;

  if (!name && !code && !organisationNumber && !email && !phone && !address) {
    return res.status(400).json({
      success: false,
      message: "At least one field must be provided for update",
    });
  }

  next();
};

export { 
  validateCreateOrganization,
  validateOrganizationIdParam,
  validateUpdateOrganization 
}
