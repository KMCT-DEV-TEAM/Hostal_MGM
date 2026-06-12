import { generateAccessToken, generateRefreshToken } from "../../utils/jwt.js";
import jwt from "jsonwebtoken";
import { findUserForLoginDb, verifyPassword, findUserByIdForRefreshDb } from "./auth.service.js";
import { sendSuccess, sendError } from "../../utils/response.js";
import asyncHandler from "../../utils/asyncHandler.js";

const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await findUserForLoginDb(email);

    if (!user) {
      return sendError(res, 401, "Invalid credentialssssss");
    }

    const isMatch = await verifyPassword(password, user.password);

    if (!isMatch) {
      return sendError(res, 401, "Invalid credentials");
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    return sendSuccess(res, 200, "Login successful", {
      accessToken,
      refreshToken,
      role: user.role,
    });
});

const refreshToken = asyncHandler(async (req, res) => {
    const token = req.token;
    

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_TOKEN);
    
    const user = await findUserByIdForRefreshDb(decoded.id);

    if (!user || !user.isActive) {
      return sendError(res, 401, "Invalid token or user deactivated");
    }

    const accessToken = generateAccessToken(user);

    return sendSuccess(res, 200, "Token refreshed successfully", { accessToken });
});

const me = asyncHandler(async (req, res) => {
    const user = await findUserByIdForRefreshDb(req.user.id);

    if (!user || !user.isActive) {
      return sendError(res, 401, "User not found or deactivated");
    }

    return sendSuccess(res, 200, "Token is Valid");
});

export {
  login,
  refreshToken,
  me,
}