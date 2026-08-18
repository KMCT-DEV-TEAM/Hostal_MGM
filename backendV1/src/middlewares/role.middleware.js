import { sendError } from "../utils/response.js";

const normalizeRole = (role) => (role || "").toLowerCase().replace(/[-_]/g, "");

const roleMiddleware = (...roles) => {
  const normalizedAllowedRoles = roles.map(normalizeRole);

  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return sendError(res, 401, "Authentication required before role verification");
    }

    const userRole = normalizeRole(req.user.role);

    if (!normalizedAllowedRoles.includes(userRole)) {
      return sendError(
        res,
        403,
        `You are not authorized to perform this action. Allowed roles: ${roles.join(", ")}, your role is ${req.user.role}`
      );
    }

    next();
  };
};

export const restrictTo = roleMiddleware;
export default roleMiddleware;
