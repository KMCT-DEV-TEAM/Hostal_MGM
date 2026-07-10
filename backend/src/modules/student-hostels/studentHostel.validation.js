import mongoose from "mongoose";

const validateUpdateStudentHostel = (req, res, next) => {
  const { studentId } = req.params;
  const { hostelId, roomNumber } = req.body;
  if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
    return res.status(400).json({ success: false, message: "Invalid or missing studentId parameter" });
  }

  if (!hostelId || !mongoose.Types.ObjectId.isValid(hostelId)) {
    return res.status(400).json({ success: false, message: "Invalid or missing hostelId" });
  }

  if (!roomNumber || roomNumber.trim() === "") {
    return res.status(400).json({ success: false, message: "Room number is required" });
  }

  next();
};

const validateVacateHostel = (req, res, next) => {
  const { studentId } = req.params;

  if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
    return res.status(400).json({ success: false, message: "Invalid or missing studentId parameter" });
  }

  next();
};

export { validateUpdateStudentHostel, validateVacateHostel };
