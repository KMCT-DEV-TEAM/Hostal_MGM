import express from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";
import {
  assignMentor,
  getAssignments,
  getAssignmentById,
  updateAssignment,
  transferMentor,
  releaseAssignment
} from "./mentorAssignment.controller.js";
import {
  validateCreateAssignment,
  validateTransferMentor,
  validateUpdateAssignment,
  validateAssignmentIdParam,
  validateAssignmentPagination
} from "./mentorAssignment.validation.js";

const router = express.Router();

// Apply auth middleware to all endpoints
router.use(authMiddleware);

// State-modifying endpoints restricted to super_admin and admin
router.post("/", roleMiddleware("super_admin", "admin"), validateCreateAssignment, assignMentor);
router.patch("/:id", roleMiddleware("super_admin", "admin"), validateUpdateAssignment, updateAssignment);
router.post("/:id/transfer", roleMiddleware("super_admin", "admin"), validateTransferMentor, transferMentor);
router.patch("/:id/release", roleMiddleware("super_admin", "admin"), validateAssignmentIdParam, releaseAssignment);

router.get("/", roleMiddleware("super_admin", "admin", "mentor", "warden", "assistant_warden"), validateAssignmentPagination, getAssignments);
router.get("/:id", roleMiddleware("super_admin", "admin", "mentor", "warden", "assistant_warden"), validateAssignmentIdParam, getAssignmentById);

export default router;
