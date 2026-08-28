import express from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import {
  registerPushSubscription,
  unregisterPushSubscription,
  getUserSubscriptions,
} from "./push.controller.js";

const router = express.Router();

// Apply auth middleware to all push routes
router.use(authMiddleware);

// POST /api/push/register
router.post("/register", registerPushSubscription);

// DELETE /api/push/unregister
router.delete("/unregister", unregisterPushSubscription);

// GET /api/push/subscriptions
router.get("/subscriptions", getUserSubscriptions);

export default router;
