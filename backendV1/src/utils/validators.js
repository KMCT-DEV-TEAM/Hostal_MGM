/**
 * validators.js
 *
 * Shared validation utilities for the backendV1 project.
 *
 * WHY THIS EXISTS:
 *   The UUID regex was duplicated in:
 *     - studentHostel.validation.js  (as UUID_REGEX, defined once)
 *     - student.validation.js        (as uuidRegex, defined TWICE in the same file)
 *
 *   Centralizing it here gives a single source of truth. Any future module
 *   that validates UUIDs imports from here instead of redefining.
 *
 * USAGE:
 *   import { UUID_REGEX, isUUID } from "../../utils/validators.js";
 *
 *   // regex test
 *   if (!UUID_REGEX.test(id)) { ... }
 *
 *   // helper function
 *   if (!isUUID(id)) { ... }
 */

/**
 * Standard UUID regex — matches any UUID version (v1–v5) in canonical form.
 * e.g.  550e8400-e29b-41d4-a716-446655440000
 *
 * Case-insensitive (the `i` flag).
 */
export const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Returns true if the given string is a valid UUID.
 *
 * @param {string} value
 * @returns {boolean}
 */
export const isUUID = (value) =>
  typeof value === "string" && UUID_REGEX.test(value);
