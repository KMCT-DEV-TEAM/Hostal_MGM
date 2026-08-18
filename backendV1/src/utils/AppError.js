/**
 * AppError.js
 *
 * Centralized application error class for this project.
 *
 * USAGE:
 *   import AppError from "../../utils/AppError.js";
 *   throw new AppError("Student not found", 404);
 *
 * WHY:
 *   The global errorMiddleware already reads `err.statusCode` and `err.message`.
 *   This class sets both in a single, consistent constructor — replacing the
 *   local `createError` helpers that were being duplicated across modules.
 *
 * COMPATIBLE WITH:
 *   - errorMiddleware.js  (reads err.statusCode, err.message)
 *   - asyncHandler.js     (forwards thrown errors to next())
 */

class AppError extends Error {
  /**
   * @param {string} message    Human-readable error description
   * @param {number} statusCode HTTP status code (e.g. 400, 404, 409)
   */
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // marks it as a known/expected error, not a bug
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
