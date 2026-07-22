import express from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";
import {
  createMentor,
  getMentors,
  getMentorById,
  updateMentor,
  updateMentorStatus,
  deleteMentor,
} from "./mentor.controller.js";
import {
  validateCreateMentor,
  validateMentorIdParam,
  validateUpdateMentor,
  validateMentorPagination,
} from "./mentor.validation.js";

const router = express.Router();

// Enforce Auth & Admin / SuperAdmin Role Guards
router.use(authMiddleware);
router.use(roleMiddleware("super_admin", "admin"));

// RESTful API Routes
router.post("/", validateCreateMentor, createMentor);
router.get("/", validateMentorPagination, getMentors);
router.get("/:id", validateMentorIdParam, getMentorById);
router.patch("/:id", validateMentorIdParam, validateUpdateMentor, updateMentor);
router.patch("/:id/status", validateMentorIdParam, updateMentorStatus);
router.delete("/:id", validateMentorIdParam, deleteMentor);

export default router;
