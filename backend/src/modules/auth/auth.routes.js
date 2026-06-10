import express from "express";
import { login, refreshToken } from "./auth.controller.js";
import { validateLogin, validateRefreshToken } from "./auth.validation.js";

const router = express.Router();

router.post("/login", validateLogin, login);
router.post("/refresh", validateRefreshToken, refreshToken);

export default router;