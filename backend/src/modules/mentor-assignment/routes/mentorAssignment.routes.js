import express from "express";
import authMiddleware from "../../../middlewares/auth.middleware.js";
import roleMiddleware from "../../../middlewares/role.middleware.js";
import {
  assignMentor,
  getAssignments,
  getAssignmentById,
  updateAssignment,
  transferMentor,
  endAssignment
} from "../controller/mentorAssignment.controller.js";
import {
  validateCreateAssignment,
  validateTransferMentor,
  validateUpdateAssignment,
  validateAssignmentIdParam,
  validateAssignmentPagination
} from "../validation/mentorAssignment.validation.js";

const router = express.Router();

// Apply auth middleware to all endpoints
router.use(authMiddleware);

// State-modifying endpoints restricted to super_admin and admin
router.post("/", roleMiddleware("super_admin", "admin"), validateCreateAssignment, assignMentor);
router.patch("/:id", roleMiddleware("super_admin", "admin"), validateUpdateAssignment, updateAssignment);
router.post("/:id/transfer", roleMiddleware("super_admin", "admin"), validateTransferMentor, transferMentor);
router.patch("/:id/end", roleMiddleware("super_admin", "admin"), validateAssignmentIdParam, endAssignment);

// GET routes (Read-only) open to all authenticated roles (mentors are scoped to their own assignments)
router.get("/", validateAssignmentPagination, getAssignments);
router.get("/:id", validateAssignmentIdParam, getAssignmentById);

export default router;
