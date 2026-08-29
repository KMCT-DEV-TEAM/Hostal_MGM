import { sendError } from "../utils/response.js";

const errorMiddleware = (err, req, res, next) => {
  console.error("Global Error Handler:", err);

  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // Body-parser JSON syntax error (e.g. empty body or invalid JSON)
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    message = "Invalid or empty JSON payload in request body.";
  }

  // Prisma unique constraint violation
  if (err.code === "P2002") {
    statusCode = 400;
    const target = Array.isArray(err.meta?.target) ? err.meta.target.join(", ") : err.meta?.target || "field";
    message = `Duplicate value error for ${target}`;
  }

  // Prisma record not found
  if (err.code === "P2025") {
    statusCode = 404;
    message = "Requested record not found";
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
  } else if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired";
  }

  return sendError(res, statusCode, message);
};

export default errorMiddleware;
