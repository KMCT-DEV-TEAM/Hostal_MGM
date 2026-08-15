import express from "express";
import { getLogs } from "./log.controller.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";

const router = express.Router();

router.use(authMiddleware); // Require authentication

// Admin and super admins can view logs
router.get("/", roleMiddleware("super_admin", "admin"), getLogs);

export default router;
