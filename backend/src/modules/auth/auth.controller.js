import { generateAccessToken, generateRefreshToken } from "../../utils/jwt.js";
import jwt from "jsonwebtoken";
import { findUserForLoginDb, verifyPassword, findUserByIdForRefreshDb } from "./auth.service.js";
import { sendSuccess, sendError } from "../../utils/response.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { hashPassword } from "../../utils/hash.js";
import User from "../users/user.model.js";
import { generateOtp, saveOtpDb, verifyOtpDb, deleteOtpDb } from "../otp/otp.service.js";
import { sendMail } from "../../utils/mailer.js";

const refreshTokenCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
};

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
    ...refreshTokenCookieOptions,
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

const logout = asyncHandler(async (req, res) => {
  res.clearCookie("refreshToken", refreshTokenCookieOptions);

  return sendSuccess(res, 200, "Logout successful");
});

const me = asyncHandler(async (req, res) => {

  const user = await User.findOne({ _id: req.user.id }).select("-password");

  if (!user || !user.isActive) {
    return sendError(res, 401, "User not found or deactivated");
  }


  return sendSuccess(res, 200, "Token is valid", { user: user._doc });
});

const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, email, settings } = req.body;
  const user = await User.findById(req.user.id);
  
  if (!user) {
    return sendError(res, 404, "User not found");
  }

  if (email && email !== user.email) {
    if (user.role === 'super_admin') {
      return sendError(res, 403, "Super Admin cannot change their email");
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendError(res, 400, "Email is already in use");
    }
    user.email = email;
  }

  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (settings !== undefined) {
    user.settings = { ...user.settings, ...settings };
  }

  await user.save();

  const userObj = { ...user._doc };
  delete userObj.password;

  return sendSuccess(res, 200, "Profile updated successfully", { user: userObj });
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

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) return sendError(res, 400, "Email is required");

  const user = await User.findOne({ email });
  if (!user) return sendError(res, 404, "No account found with this email");

  const otpCode = generateOtp();
  await saveOtpDb(email, otpCode);

  const subject = "Password Reset OTP";
  const text = `Your OTP for password reset is: ${otpCode}. It will expire in 5 minutes.`;
  const html = `<p>Your OTP for password reset is: <strong>${otpCode}</strong></p><p>It will expire in 5 minutes.</p>`;

  await sendMail(email, subject, text, html);

  return sendSuccess(res, 200, "OTP sent to email");
});

const verifyResetOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return sendError(res, 400, "Email and OTP are required");

  const isValid = await verifyOtpDb(email, otp);
  if (!isValid) return sendError(res, 400, "Invalid or expired OTP");

  await deleteOtpDb(email);

  // Generate a short-lived token to allow password reset
  const resetToken = jwt.sign({ email }, process.env.JWT_ACCESS_TOKEN || 'fallback_secret', { expiresIn: '15m' });

  return sendSuccess(res, 200, "OTP verified", { resetToken });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { resetToken, newPassword } = req.body;
  if (!resetToken || !newPassword) return sendError(res, 400, "Token and new password are required");

  try {
    const decoded = jwt.verify(resetToken, process.env.JWT_ACCESS_TOKEN || 'fallback_secret');
    const user = await User.findOne({ email: decoded.email });
    if (!user) return sendError(res, 404, "User not found");

    const hashedPassword = await hashPassword(newPassword);
    user.password = hashedPassword;
    await user.save();

    return sendSuccess(res, 200, "Password reset successfully");
  } catch (error) {
    return sendError(res, 400, "Invalid or expired reset token");
  }
});

export {
  login,
  refreshToken,
  logout,
  me,
  changePassword,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  updateProfile,
}
