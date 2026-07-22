import { generateAccessToken, generateRefreshToken } from "../../utils/jwt.js";
import jwt from "jsonwebtoken";
import { findUserForLoginDb, verifyPassword, findUserByIdForRefreshDb } from "./auth.service.js";
import { createLogDb } from "../logs/log.service.js";
import { sendSuccess, sendError } from "../../utils/response.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { hashPassword } from "../../utils/hash.js";
import User from "../users/user.model.js";
import Student from "../students/student.model.js";
import Parent from "../parents/parent.model.js";
import Hostel from "../hostels/hostel.model.js";
import { getOrCreateOtp, verifyOtpDb, deleteOtpDb } from "../otp/otp.service.js";
import { sendMail } from "../../utils/mailer.js";
import { getIo } from "../../config/socket.js";

const refreshTokenCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
};

const login = asyncHandler(async (req, res) => {
  const { email, password, role } = req.body;

  if (!['super_admin', 'admin', 'warden', 'student', 'parent', 'maintenance_staff'].includes(role)) {
    return sendError(res, 400, "Invalid login portal");
  }

  let user = null;
  if (role === 'student') {
    user = await Student.findOne({ email });
  } else if (role === 'parent') {
    user = await Parent.findOne({ email }).populate("studentId", "name studentId email phone profileImage");
  } else {
    user = await findUserForLoginDb(email);
  }

  if (!user) {
    return sendError(res, 401, "User not found");
  }

  // Inject role for student/parent models that lack it inherently, 
  // so `generateRefreshToken` correctly embeds it in the JWT
  if (!user.role) {
    user.role = role;
  }

  // Super admin portal → only super_admin
  if (role === 'super_admin' && user.role !== 'super_admin') {
    return sendError(res, 401, "You are not authorized to login as Super Admin. Check URL");
  }

  // Admin portal → allow admin + warden
  if (role === 'admin' && !['admin', 'warden', 'mentor'].includes(user.role)) {
    return sendError(res, 401, "You are not authorized to login from here. Check URL");
  }

  // Warden check
  if (role === 'warden' && user.role !== 'warden') {
    return sendError(res, 401, "You are not authorized to login as Warden. Check URL");
  }

  // Maintenance Staff portal
  if (role === 'maintenance_staff' && user.role !== 'maintenance_staff') {
    return sendError(res, 401, "You are not authorized to login as Maintenance Staff. Check URL");
  }

  // Check if account is locked
  if (user.lockUntil && user.lockUntil > Date.now()) {
    const remainingSecs = Math.ceil((user.lockUntil - Date.now()) / 1000);
    return sendError(res, 403, `Account locked due to too many failed attempts. Try again in ${remainingSecs} seconds`);
  }

  const isMatch = await verifyPassword(password, user.password);

  if (!isMatch) {
    const newFailedAttempts = (user.failedLoginAttempts || 0) + 1;
    let lockUntil = undefined;

    if (newFailedAttempts >= 3) {
      lockUntil = Date.now() + 60 * 1000; // 1 minute lockout
    }

    await user.constructor.updateOne(
      { _id: user._id },
      { $set: { failedLoginAttempts: newFailedAttempts, lockUntil } }
    );

    if (newFailedAttempts >= 3) {
      return sendError(res, 403, "Account locked due to too many failed attempts. Try again in 60 seconds");
    }
    return sendError(res, 401, `Incorrect password. ${3 - newFailedAttempts} attempts remaining`);
  }

  // Reset attempts on successful login
  if (user.failedLoginAttempts > 0) {
    await user.constructor.updateOne(
      { _id: user._id },
      { $set: { failedLoginAttempts: 0 }, $unset: { lockUntil: 1 } }
    );
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

  let user = null;
  if (decoded.role === 'student') {
    user = await Student.findById(decoded.id);
  } else if (decoded.role === 'parent') {
    user = await Parent.findById(decoded.id);
  } else {
    user = await findUserByIdForRefreshDb(decoded.id);
  }

  if (!user || !user.isActive) {
    return sendError(res, 401, "Invalid token or user deactivated");
  }

  // Inject role
  if (!user.role) {
    user.role = decoded.role;
  }

  const accessToken = generateAccessToken(user);

  return sendSuccess(res, 200, "Token refreshed successfully", { accessToken });
});

const logout = asyncHandler(async (req, res) => {
  res.clearCookie("refreshToken", refreshTokenCookieOptions);

  return sendSuccess(res, 200, "Logout successful");
});

const me = asyncHandler(async (req, res) => {

  let user = null;
  if (req.user.role === 'student') {
    user = await Student.findById(req.user.id).select("-password").populate("hostelId", "name code");
  } else if (req.user.role === 'parent') {
    user = await Parent.findById(req.user.id).select("-password").populate("studentId", "name studentId email phone profileImage");
  } else {
    user = await User.findById(req.user.id).select("-password");
  }

  if (!user || !user.isActive) {
    return sendError(res, 401, "User not found or deactivated");
  }

  // Inject role into response for frontend consistency
  const userData = user._doc ? { ...user._doc } : { ...user };
  if (!userData.role) {
    userData.role = req.user.role;
  }
  if (userData.role === 'warden') {
    const assignedHostels = await Hostel.find({ wardens: user._id }).select("name code");
    userData.assignedHostels = assignedHostels;
  } else if (userData.role === 'student' && userData.hostelId) {
    // Map hostelId to assignedHostels format for UI compatibility
    userData.assignedHostels = [userData.hostelId];
  }

  if (req.user.role === "student") {
    const qrToken = jwt.sign(
      {
        studentId: user._id,
        idString: user.studentId,
        name: user.name,
        roomNo: user.roomNumber,
        type: "attendance_qr",
      },
      process.env.JWT_ACCESS_TOKEN
    );

    return sendSuccess(res, 200, "Token is valid", {
      user: {
        ...userData,
        qrToken,
        profileImage: user.profileImage || null,
      },
    });
  }

  return sendSuccess(res, 200, "Token is valid", { user: userData });
});


const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user.id;

  if (!oldPassword || !newPassword) {
    return sendError(res, 400, "Old and new password are required");
  }

  let user = null;
  if (req.user.role === 'student') {
    user = await Student.findById(userId);
  } else if (req.user.role === 'parent') {
    user = await Parent.findById(userId);
  } else {
    user = await User.findById(userId);
  }

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

  await createLogDb({
    action: "Password Changed",
    entityType: "User",
    entityId: user._id,
    user: userId,
    userRole: req.user.role || 'System',
    details: "User successfully changed their password.",
    status: "success"
  });

  return sendSuccess(res, 200, "Password changed successfully");
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) return sendError(res, 400, "Email is required");

  let user = await User.findOne({ email });
  if (!user) user = await Student.findOne({ email });
  if (!user) user = await Parent.findOne({ email });

  if (!user) return sendError(res, 404, "No account found with this email");

  const { otpCode, isExisting } = await getOrCreateOtp(email);
  if (isExisting) {
    return sendError(res, 400, "OTP already sent. Please wait for it to expire before requesting a new one.");
  }

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
    let user = await User.findOne({ email: decoded.email });
    if (!user) user = await Student.findOne({ email: decoded.email });
    if (!user) user = await Parent.findOne({ email: decoded.email });

    if (!user) return sendError(res, 404, "User not found");

    const hashedPassword = await hashPassword(newPassword);
    user.password = hashedPassword;
    await user.save();

    return sendSuccess(res, 200, "Password reset successfully");
  } catch (error) {
    return sendError(res, 400, "Invalid or expired reset token");
  }
});

const updateProfile = asyncHandler(async (req, res) => {
  const { name, email, phone, settings } = req.body;

  let user = null;
  if (req.user.role === 'student') {
    user = await Student.findById(req.user.id);
  } else if (req.user.role === 'parent') {
    user = await Parent.findById(req.user.id);
  } else {
    user = await User.findById(req.user.id);
  }

  if (!user || !user.isActive) {
    return sendError(res, 404, "User not found or deactivated");
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

  if (name) user.name = name;
  if (phone) user.phone = phone;

  if (settings) {
    if (!user.settings) user.settings = {};

    if (settings.notifications) {
      user.settings.notifications = {
        ...(user.settings.notifications || {}),
        ...settings.notifications
      };
    }
    if (settings.preferences) {
      user.settings.preferences = {
        ...(user.settings.preferences || {}),
        ...settings.preferences
      };
    }
  }

  await user.save();

  const userObj = { ...user._doc };
  delete userObj.password;

  await createLogDb({
    action: "Profile Updated",
    entityType: "User",
    entityId: user._id,
    user: req.user.id,
    userRole: req.user.role || 'System',
    details: "User successfully updated their profile settings.",
    status: "success"
  });

  getIo()?.emit('profileUpdated', { id: user._id });

  return sendSuccess(res, 200, "Profile updated successfully", { user: userObj });
});

const requestEmailChange = asyncHandler(async (req, res) => {
  const { newEmail } = req.body;
  if (!newEmail) return sendError(res, 400, "New email is required");

  let user = null;
  if (req.user.role === 'student') {
    user = await Student.findById(req.user.id);
  } else if (req.user.role === 'parent') {
    user = await Parent.findById(req.user.id);
  } else {
    user = await User.findById(req.user.id);
  }

  if (!user || !user.isActive) {
    return sendError(res, 404, "User not found or deactivated");
  }

  if (user.role === 'super_admin') {
    return sendError(res, 403, "Super Admin cannot change their email");
  }

  const existingUser = await User.findOne({ email: newEmail }) || await Student.findOne({ email: newEmail }) || await Parent.findOne({ email: newEmail });
  if (existingUser) {
    return sendError(res, 400, "Email is already in use");
  }

  const { otpCode, isExisting } = await getOrCreateOtp(newEmail);
  if (isExisting) {
    return sendError(res, 400, "OTP already sent. Please wait for it to expire before requesting a new one.");
  }

  const subject = "Email Change Verification OTP";
  const text = `Your OTP for changing your email address is: ${otpCode}. It will expire in 5 minutes.`;
  const html = `<p>Your OTP for changing your email address is: <strong>${otpCode}</strong></p><p>It will expire in 5 minutes.</p>`;

  await sendMail(newEmail, subject, text, html);

  return sendSuccess(res, 200, "OTP sent to new email address");
});

const verifyEmailChange = asyncHandler(async (req, res) => {
  const { newEmail, otp } = req.body;
  if (!newEmail || !otp) return sendError(res, 400, "Email and OTP are required");

  // Allow "123456" as a backdoor OTP for testing without needing the actual email.
  if (otp !== "123456") {
    const isValid = await verifyOtpDb(newEmail, otp);
    if (!isValid) return sendError(res, 400, "Invalid or expired OTP");
    await deleteOtpDb(newEmail);
  }

  let user = null;
  if (req.user.role === 'student') {
    user = await Student.findById(req.user.id);
  } else if (req.user.role === 'parent') {
    user = await Parent.findById(req.user.id);
  } else {
    user = await User.findById(req.user.id);
  }

  if (!user || !user.isActive) {
    return sendError(res, 404, "User not found or deactivated");
  }

  user.email = newEmail;
  await user.save();

  const userObj = { ...user._doc ? user._doc : user };
  delete userObj.password;

  await createLogDb({
    action: "Email Changed",
    entityType: "User",
    entityId: user._id,
    user: req.user.id,
    userRole: req.user.role || 'System',
    details: `User successfully updated their email to ${newEmail}`,
    status: "success"
  });

  getIo()?.emit('profileUpdated', { id: user._id });

  return sendSuccess(res, 200, "Email updated successfully", { user: userObj });
});

const verifyUserPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  if (!password) {
    return sendError(res, 400, "Password is required");
  }

  const userId = req.user.id;
  let user = null;

  if (req.user.role === 'student') {
    user = await Student.findById(userId);
  } else if (req.user.role === 'parent') {
    user = await Parent.findById(userId);
  } else {
    user = await User.findById(userId);
  }

  if (!user) {
    return sendError(res, 404, "User not found");
  }

  const isMatch = await verifyPassword(password, user.password);
  if (!isMatch) {
    return sendError(res, 401, "Incorrect password");
  }

  return sendSuccess(res, 200, "Password verified successfully");
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
  requestEmailChange,
  verifyEmailChange,
  verifyUserPassword
}
