import express from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";
import { ROLES } from "../../constants/roles.js";
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
  validateAssignmentPagination,
  validateReleaseAssignment
} from "./mentorAssignment.validation.js";

const router = express.Router();

// Apply auth middleware to all endpoints
router.use(authMiddleware);

// State-modifying endpoints restricted to super_admin and admin
router.post(
  "/", 
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.ADMIN), 
  validateCreateAssignment, 
  assignMentor
);

router.patch(
  "/:id", 
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.ADMIN), 
  validateUpdateAssignment, 
  updateAssignment
);

router.post(
  "/:id/transfer", 
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.ADMIN), 
  validateTransferMentor, 
  transferMentor
);

router.patch(
  "/:id/release", 
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.ADMIN), 
  validateReleaseAssignment, 
  releaseAssignment
);

router.get(
  "/", 
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MENTOR, ROLES.WARDEN, ROLES.ASSISTANT_WARDEN), 
  validateAssignmentPagination, 
  getAssignments
);

router.get(
  "/:id", 
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MENTOR, ROLES.WARDEN, ROLES.ASSISTANT_WARDEN), 
  validateAssignmentIdParam, 
  getAssignmentById
);

export default router;
