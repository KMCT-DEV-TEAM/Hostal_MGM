import express from "express";
import { getLogs } from "./log.controller.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";

const router = express.Router();

router.use(authMiddleware); // Require authentication

// Only super admins can view logs
router.get("/", roleMiddleware("super_admin"), getLogs);

export default router;
