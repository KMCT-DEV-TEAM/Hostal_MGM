import express from "express";
import verifyStudentAccess from "../../middlewares/verifyStudentAccess.middleware.js";
import { getStudentProfileForParentV2 } from "./profile.controller.js";

const router = express.Router({ mergeParams: true });

// Protect all routes with explicit student access check
router.use(verifyStudentAccess);

router.get("/", getStudentProfileForParentV2);

export default router;
