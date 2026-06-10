import { sendError } from "../utils/response.js";

const errorMiddleware = (err, req, res, next) => {
  console.error(err);

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  return sendError(res, statusCode, message);
};

export default errorMiddleware;
