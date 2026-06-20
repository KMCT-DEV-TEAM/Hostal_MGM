import express from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";
import {
  getPasswordRequests,
  approvePasswordRequest,
  rejectPasswordRequest,
} from "./passwordRequest.controller.js";

const router = express.Router();

router.get(
  "/",
  authMiddleware,
  roleMiddleware("super_admin"),
  getPasswordRequests
);

router.patch(
  "/:id/approve",
  authMiddleware,
  roleMiddleware("super_admin"),
  approvePasswordRequest
);

router.patch(
  "/:id/reject",
  authMiddleware,
  roleMiddleware("super_admin"),
  rejectPasswordRequest
);

export default router;
