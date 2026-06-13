import mongoose from "mongoose";

const validateCreateHostel = (req, res, next) => {
  const { name, code, email, organizations, wardens, adminId } = req.body;

  if (!name || !code || !email) {
    return res.status(400).json({
      success: false,
      message: "Hostel name, code, and email are required",
    });
  }

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!isValidEmail) {
    return res.status(400).json({
      success: false,
      message: "Invalid email format",
    });
  }

  if (organizations && Array.isArray(organizations)) {
    for (const orgId of organizations) {
      if (!mongoose.Types.ObjectId.isValid(orgId)) {
        return res.status(400).json({ success: false, message: "Invalid Organization ID in array" });
      }
    }
  }

  if (wardens && Array.isArray(wardens)) {
    for (const wardenId of wardens) {
      if (!mongoose.Types.ObjectId.isValid(wardenId)) {
        return res.status(400).json({ success: false, message: "Invalid Warden ID in array" });
      }
    }
  }

  if (adminId && !mongoose.Types.ObjectId.isValid(adminId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Admin ID",
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
  const { name, code, email, organizations, wardens, adminId, location, capacity, isActive } = req.body;

  if (
    name === undefined &&
    code === undefined &&
    email === undefined &&
    organizations === undefined &&
    wardens === undefined &&
    adminId === undefined &&
    location === undefined &&
    capacity === undefined &&
    isActive === undefined
  ) {
    return res.status(400).json({
      success: false,
      message: "At least one field must be provided for update",
    });
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({
      success: false,
      message: "Invalid email format",
    });
  }

  if (organizations && Array.isArray(organizations)) {
    for (const orgId of organizations) {
      if (!mongoose.Types.ObjectId.isValid(orgId)) {
        return res.status(400).json({ success: false, message: "Invalid Organization ID in array" });
      }
    }
  }

  if (wardens && Array.isArray(wardens)) {
    for (const wardenId of wardens) {
      if (!mongoose.Types.ObjectId.isValid(wardenId)) {
        return res.status(400).json({ success: false, message: "Invalid Warden ID in array" });
      }
    }
  }

  if (adminId && !mongoose.Types.ObjectId.isValid(adminId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Admin ID",
    });
  }

  next();
};

export { validateCreateHostel, validateHostelIdParam, validateUpdateHostel };
