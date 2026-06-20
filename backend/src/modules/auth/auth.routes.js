import express from "express";
import { login, refreshToken, logout, me, changePassword, forgotPassword, verifyResetOtp, resetPassword, updateProfile } from "./auth.controller.js";
import { validateLogin, validateRefreshToken } from "./auth.validation.js";
import authMiddleware from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/login", validateLogin, login);
router.post("/refresh", validateRefreshToken, refreshToken);
router.post("/logout", logout);
router.get("/me", authMiddleware, me);
router.post("/change-password", authMiddleware, changePassword);
router.patch("/profile", authMiddleware, updateProfile);

router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-otp", verifyResetOtp);
router.post("/reset-password", resetPassword);

export default router;
