import jwt from "jsonwebtoken";
import User from "../modules/users/user.model.js";
import Student from "../modules/students/student.model.js";
import Parent from "../modules/parents/parent.model.js";

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Access token required",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_ACCESS_TOKEN
    );

    req.user = decoded;

    let userModel = null;
    if (decoded.role === 'student') {
      userModel = Student;
    } else if (decoded.role === 'parent') {
      userModel = Parent;
    } else {
      userModel = User;
    }

    const user = await userModel.findById(decoded.id).select('isActive');
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "User deactivated",
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
};

export default authMiddleware;