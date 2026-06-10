import mongoose from "mongoose";

const validateParentIdParam = (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Parent ID",
    });
  }

  next();
};

const validateUpdateParent = (req, res, next) => {
  const { name, email, phone, relationship, address } = req.body;

  if (!name && !email && !phone && !relationship && !address) {
    return res.status(400).json({
      success: false,
      message: "At least one field must be provided for update",
    });
  }

  next();
};

export {
  validateParentIdParam,
  validateUpdateParent
};
