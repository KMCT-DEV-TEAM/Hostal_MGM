import express from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  toggleCourseStatus,
  bulkUpdateCourseStatus,
} from "./course.controller.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", createCourse);
router.get("/", getCourses);
router.put("/bulk-status", bulkUpdateCourseStatus);
router.get("/:id", getCourseById);
router.put("/:id", updateCourse);
router.patch("/:id/status", toggleCourseStatus);

export default router;
