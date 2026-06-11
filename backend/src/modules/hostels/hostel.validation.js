import mongoose from "mongoose";

const validateCreateHostel = (req, res, next) => {
  const { name, code } = req.body;

  if (!name || !code) {
    return res.status(400).json({
      success: false,
      message: "Hostel name and code are required",
    });
  }

  if (req.body.wardenId && !mongoose.Types.ObjectId.isValid(req.body.wardenId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Warden ID",
    });
  }

  next();
};

const validateHostelIdParam = (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Hostel ID",
    });
  }

  next();
};

const validateUpdateHostel = (req, res, next) => {
  const { name, code, wardenId, location, capacity, isActive } = req.body;

  if (
    name === undefined &&
    code === undefined &&
    wardenId === undefined &&
    location === undefined &&
    capacity === undefined &&
    isActive === undefined
  ) {
    return res.status(400).json({
      success: false,
      message: "At least one field must be provided for update",
    });
  }

  if (wardenId && !mongoose.Types.ObjectId.isValid(wardenId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Warden ID",
    });
  }

  next();
};

export { validateCreateHostel, validateHostelIdParam, validateUpdateHostel };
