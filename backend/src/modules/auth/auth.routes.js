import express from "express";
import { login, refreshToken, logout, me, updateProfile, changePassword, forgotPassword, verifyResetOtp, resetPassword } from "./auth.controller.js";
import { validateLogin, validateRefreshToken } from "./auth.validation.js";
import authMiddleware from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/login", validateLogin, login);
router.post("/refresh", validateRefreshToken, refreshToken);
router.post("/logout", logout);
router.get("/me", authMiddleware, me);
router.put("/profile", authMiddleware, updateProfile);
router.post("/change-password", authMiddleware, changePassword);

router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-otp", verifyResetOtp);
router.post("/reset-password", resetPassword);

import { verifyEmailForReset, submitPasswordRequest } from "../passwordRequests/passwordRequest.controller.js";
router.post("/verify-email", verifyEmailForReset);
router.post("/password-request", submitPasswordRequest);

export default router;
