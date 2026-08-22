import express from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";
import { createPass } from "./pass.controller.js";
import { validateCreatePass } from "./pass.validation.js";

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  roleMiddleware("student"),
  validateCreatePass,
  createPass
);

export default router;
