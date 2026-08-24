import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma.js";
import { sendError } from "../utils/response.js";

const authMiddleware = async (req, res, next) => {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return sendError(res, 401, "Access token required");
    }

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_TOKEN);

    let user = null;
    const roleLower = (decoded.role || "").toLowerCase();

    if (roleLower === "student") {
      user = await prisma.student.findUnique({
        where: { id: decoded.id },
        select: { id: true, email: true, isActive: true, name: true },
      });
      if (user) user.role = "student";
    } else if (roleLower === "parent") {
      user = await prisma.parent.findUnique({
        where: { id: decoded.id },
        select: { id: true, email: true, isActive: true, parentName: true },
      });
      if (user) user.role = "parent";
    } else {
      user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, email: true, isActive: true, name: true, role: true, organizationId: true },
      });
      if (user) {
        user.organization = user.organizationId;
        user.role = user.role.toLowerCase();
      }
    }

    if (!user || !user.isActive) {
      return sendError(res, 401, "User not found or deactivated");
    }

    req.user = {
      ...decoded,
      ...user,
      id: user.id,
      role: user.role,
    };

    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error?.message);
    return sendError(res, 401, "Invalid or expired token");
  }
};

export const protect = authMiddleware;
export default authMiddleware;
