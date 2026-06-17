import { generateAccessToken, generateRefreshToken } from "../../utils/jwt.js";
import jwt from "jsonwebtoken";
import { findUserForLoginDb, verifyPassword, findUserByIdForRefreshDb } from "./auth.service.js";
import { sendSuccess, sendError } from "../../utils/response.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { hashPassword } from "../../utils/hash.js";
import User from "../users/user.model.js";

const login = asyncHandler(async (req, res) => {
  const { email, password, role } = req.body;

  if (!['super_admin', 'admin'].includes(role)) {
    return sendError(res, 400, "Invalid login portal");
  }

  const user = await findUserForLoginDb(email);

  if (!user) {
    return sendError(res, 401, "Invalid credentials");
  }

  // Super admin portal → only super_admin
  if (role === 'super_admin' && user.role !== 'super_admin') {
    return sendError(res, 401, "You are not authorized to login as Super Admin. Check URL");
  }

  // Admin/Warden portal → allow admin + warden
  if (role === 'admin' && !['admin', 'warden'].includes(user.role)) {
    return sendError(res, 401, "You are not authorized to login from here. Check URL");
  }

  const isMatch = await verifyPassword(password, user.password);

  if (!isMatch) {
    return sendError(res, 401, "Invalid credentials");
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  return sendSuccess(res, 200, "Login successful", {
    accessToken,
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

  const user = await User.findOne({ _id: req.user.id }).select("-password");

  if (!user || !user.isActive) {
    return sendError(res, 401, "User not found or deactivated");
  }


  return sendSuccess(res, 200, "Token is valid", { user: user._doc });
});

const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user.id;

  if (!oldPassword || !newPassword) {
    return sendError(res, 400, "Old and new password are required");
  }

  const user = await User.findById(userId);
  if (!user) {
    return sendError(res, 404, "User not found");
  }

  const isMatch = await verifyPassword(oldPassword, user.password);
  if (!isMatch) {
    return sendError(res, 401, "Invalid old password");
  }

  const hashedPassword = await hashPassword(newPassword);
  user.password = hashedPassword;
  user.temppass = false;
  await user.save();

  return sendSuccess(res, 200, "Password changed successfully");
});

export {
  login,
  refreshToken,
  me,
  changePassword,
}