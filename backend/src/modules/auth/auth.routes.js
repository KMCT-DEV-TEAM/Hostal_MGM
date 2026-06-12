import express from "express";
import { login, refreshToken, me } from "./auth.controller.js";
import { validateLogin, validateRefreshToken } from "./auth.validation.js";
import authMiddleware from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/login", validateLogin, login);
router.post("/refresh", validateRefreshToken, refreshToken);
router.get("/me", authMiddleware, me);

export default router;