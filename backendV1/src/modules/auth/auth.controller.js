import { generateAccessToken, generateRefreshToken } from "../../utils/jwt.js";
import { sendSuccess, sendError } from "../../utils/response.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { comparePassword, hashPassword } from "../../utils/hash.js";
import { prisma } from "../../config/prisma.js";
import { getOrCreateOtp, verifyOtpDb, deleteOtpDb } from "../otps/otp.service.js";
import { sendMail } from "../../utils/mailer.js";
import { getIo } from "../../config/socket.js";
import jwt from "jsonwebtoken";
import { ROLES } from "../../constants/roles.js";

const refreshTokenCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
};

const login = asyncHandler(async (req, res) => {
  const { email, password, role } = req.body;

  if (![ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.WARDEN, ROLES.ASSISTANT_WARDEN, ROLES.STUDENT, ROLES.PARENT, ROLES.SECURITY, ROLES.MENTOR].includes(role)) {
    return sendError(res, 400, "Invalid login portal");
  }

  let user = null;
  let dbRole = null;
  let modelName = '';

  if (role === ROLES.STUDENT) {
    user = await prisma.student.findUnique({ where: { email } });
    dbRole = ROLES.STUDENT;
    modelName = 'student';
  } else if (role === ROLES.PARENT) {
    user = await prisma.parent.findUnique({ where: { email } });
    dbRole = ROLES.PARENT;
    modelName = 'parent';
  } else {
    user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      dbRole = user.role;
      modelName = 'user';
    }
  }

  if (!user) {
    return sendError(res, 401, "User not found");
  }

  // Inject role for student/parent models that lack it natively in DB
  user.role = dbRole;

  // Portal Authorization Checks
  if (role === ROLES.SUPER_ADMIN && user.role !== ROLES.SUPER_ADMIN) {
    return sendError(res, 401, "You are not authorized to login as Super Admin. Check URL");
  }
  if (role === ROLES.ADMIN && ![ROLES.ADMIN, ROLES.WARDEN, ROLES.ASSISTANT_WARDEN, ROLES.MENTOR].includes(user.role)) {
    return sendError(res, 401, "You are not authorized to login from here. Check URL");
  }
  if (role === ROLES.WARDEN && ![ROLES.WARDEN, ROLES.ASSISTANT_WARDEN].includes(user.role)) {
    return sendError(res, 401, "You are not authorized to login as Warden. Check URL");
  }
  if (role === ROLES.ASSISTANT_WARDEN && ![ROLES.WARDEN, ROLES.ASSISTANT_WARDEN].includes(user.role)) {
    return sendError(res, 401, "You are not authorized to login as Assistant Warden. Check URL");
  }
  if (role === ROLES.MENTOR && user.role !== ROLES.MENTOR) {
    return sendError(res, 401, "You are not authorized to login as Mentor. Check URL");
  }

  if (user.lockUntil && user.lockUntil > new Date()) {
    const remainingSecs = Math.ceil((user.lockUntil.getTime() - Date.now()) / 1000);
    return sendError(res, 403, `Account locked due to too many failed attempts. Try again in ${remainingSecs} seconds`);
  }

  const isMatch = await comparePassword(password, user.password);

  if (!isMatch) {
    const newFailedAttempts = (user.failedLoginAttempts || 0) + 1;
    let lockUntil = null;

    if (newFailedAttempts >= 3) {
      lockUntil = new Date(Date.now() + 60 * 1000); // 1 minute lockout
    }

    if (modelName === 'student') {
      await prisma.student.update({ where: { id: user.id }, data: { failedLoginAttempts: newFailedAttempts, lockUntil } });
    } else if (modelName === 'parent') {
      await prisma.parent.update({ where: { id: user.id }, data: { failedLoginAttempts: newFailedAttempts, lockUntil } });
    } else {
      await prisma.user.update({ where: { id: user.id }, data: { failedLoginAttempts: newFailedAttempts, lockUntil } });
    }

    if (newFailedAttempts >= 3) {
      return sendError(res, 403, "Account locked due to too many failed attempts. Try again in 60 seconds");
    }
    return sendError(res, 401, `Incorrect password. ${3 - newFailedAttempts} attempts remaining`);
  }

  // Reset attempts on successful login
  if (user.failedLoginAttempts > 0) {
    if (modelName === 'student') {
      await prisma.student.update({ where: { id: user.id }, data: { failedLoginAttempts: 0, lockUntil: null } });
    } else if (modelName === 'parent') {
      await prisma.parent.update({ where: { id: user.id }, data: { failedLoginAttempts: 0, lockUntil: null } });
    } else {
      await prisma.user.update({ where: { id: user.id }, data: { failedLoginAttempts: 0, lockUntil: null } });
    }
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
  const token = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!token) {
    return sendError(res, 401, "No refresh token provided");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_TOKEN);
    let user = null;

    if (decoded.role === ROLES.STUDENT) {
      user = await prisma.student.findUnique({ where: { id: decoded.id } });
      if (user) user.role = ROLES.STUDENT;
    } else if (decoded.role === ROLES.PARENT) {
      user = await prisma.parent.findUnique({ where: { id: decoded.id } });
      if (user) user.role = ROLES.PARENT;
    } else {
      user = await prisma.user.findUnique({ where: { id: decoded.id } });
    }

    if (!user || !user.isActive) {
      return sendError(res, 401, "User not found or deactivated");
    }

    const accessToken = generateAccessToken(user);

    return sendSuccess(res, 200, "Token refreshed successfully", { accessToken });
  } catch (err) {
    return sendError(res, 401, "Invalid or expired refresh token");
  }
});

const me = asyncHandler(async (req, res) => {
  let user = null;

  if (req.user.role === ROLES.STUDENT) {
    user = await prisma.student.findUnique({
      where: { id: req.user.id },
      include: {
        studentHostels: {
          where: { status: 'active' },
          include: { 
            hostel: {
              select: { id: true, name: true, code: true }
            } 
          }
        }
      }
    });
    
    if (user) {
        user.role = ROLES.STUDENT;
        const activeAllocation = user.studentHostels?.[0];
        
        if (activeAllocation?.hostel) {
            user.assignedHostels = [{
              _id: activeAllocation.hostel.id,
              id: activeAllocation.hostel.id,
              name: activeAllocation.hostel.name,
              code: activeAllocation.hostel.code
            }];
        }
        
        const qrToken = jwt.sign(
          {
            studentId: user.id,
            admissionNo: user.admissionNo,
            name: user.name,
            roomNo: activeAllocation?.roomNumber || null,
            type: "attendance_qr",
          },
          process.env.JWT_ACCESS_TOKEN
        );
        
        user.qrToken = qrToken;
    }
  } else if (req.user.role === ROLES.PARENT) {
    user = await prisma.parent.findUnique({
      where: { id: req.user.id },
      include: {
        studentParents: {
          where: { status: 'active' },
          include: { student: true }
        }
      }
    });
    if (user) {
      user.role = ROLES.PARENT;
      user.students = user.studentParents.map(sp => sp.student);
    }
  } else {
    user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        organization: true,
        hostelWardens: { include: { hostel: true } }
      }
    });
    if (user) {
        if (user.role === 'WARDEN' || user.role === 'ASSISTANT_WARDEN') {
            user.assignedHostels = user.hostelWardens.map(hw => hw.hostel);
        }
        // Normalize role to lowercase for frontend compatibility
        user.role = user.role.toLowerCase();
    }
  }

  if (!user || !user.isActive) {
    return sendError(res, 401, "User not found or deactivated");
  }
  user.temppass = Boolean(user.tempPassword);
  delete user.password;
  delete user.passwordHash;

  return sendSuccess(res, 200, "Token is valid", { user });
});

const logout = asyncHandler(async (req, res) => {
  res.clearCookie("refreshToken", refreshTokenCookieOptions);
  return sendSuccess(res, 200, "Logout successful");
});

export const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user.id;

  if (!oldPassword || !newPassword) {
    return sendError(res, 400, "Old and new password are required");
  }

  let user = null;
  let model = 'user';

  if (req.user.role === ROLES.STUDENT) {
    user = await prisma.student.findUnique({ where: { id: userId } });
    model = 'student';
  } else if (req.user.role === ROLES.PARENT) {
    user = await prisma.parent.findUnique({ where: { id: userId } });
    model = 'parent';
  } else {
    user = await prisma.user.findUnique({ where: { id: userId } });
  }

  if (!user) {
    return sendError(res, 404, "User not found");
  }

  const isMatch = await comparePassword(oldPassword, user.password || user.passwordHash);
  if (!isMatch) {
    return sendError(res, 401, "Invalid current password");
  }

  const hashedPassword = await hashPassword(newPassword);

  if (model === 'student') {
    await prisma.student.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        tempPassword: false,
        failedLoginAttempts: 0,
        lockUntil: null
      }
    });
  } else if (model === 'parent') {
    await prisma.parent.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        tempPassword: false,
        failedLoginAttempts: 0,
        lockUntil: null
      }
    });
  } else {
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        tempPassword: false,
        failedLoginAttempts: 0,
        lockUntil: null
      }
    });
  }

  return sendSuccess(res, 200, "Password changed successfully");
});

export const verifyPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  
  if (!password) {
    return sendError(res, 400, "Password is required");
  }

  let user = null;

  if (req.user.role === ROLES.STUDENT) {
    user = await prisma.student.findUnique({ where: { id: req.user.id } });
  } else if (req.user.role === ROLES.PARENT) {
    user = await prisma.parent.findUnique({ where: { id: req.user.id } });
  } else {
    user = await prisma.user.findUnique({ where: { id: req.user.id } });
  }

  if (!user) {
    return sendError(res, 401, "User not found");
  }

  const isMatch = await comparePassword(password, user.password);

  if (!isMatch) {
    return sendError(res, 401, "Incorrect password");
  }

  return sendSuccess(res, 200, "Password verified successfully");
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) return sendError(res, 400, "Email is required");

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) user = await prisma.student.findUnique({ where: { email } });
  if (!user) user = await prisma.parent.findUnique({ where: { email } });

  if (!user) return sendError(res, 404, "No account found with this email");

  const { otpCode, isExisting } = await getOrCreateOtp(email);
  if (isExisting) {
    return sendError(res, 400, "OTP already sent. Please wait for it to expire before requesting a new one.");
  }

  const subject = "Password Reset OTP";
  const text = `Your OTP for password reset is: ${otpCode}. It will expire in 5 minutes.`;
  const html = `<p>Your OTP for password reset is: <strong>${otpCode}</strong></p><p>It will expire in 5 minutes.</p>`;

  await sendMail(email, subject, text, html).catch((err) => {
    console.error("Failed to send OTP mail:", err);
  });

  return sendSuccess(res, 200, "OTP sent to email");
});

export const verifyResetOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return sendError(res, 400, "Email and OTP are required");

  // Support 123456 as test OTP
  if (otp !== "123456") {
    const isValid = await verifyOtpDb(email, otp);
    if (!isValid) return sendError(res, 400, "Invalid or expired OTP");
    await deleteOtpDb(email);
  }

  // Generate a short-lived token to allow password reset
  const resetToken = jwt.sign({ email }, process.env.JWT_ACCESS_TOKEN || 'fallback_secret', { expiresIn: '15m' });

  return sendSuccess(res, 200, "OTP verified", { resetToken });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { resetToken, newPassword } = req.body;
  if (!resetToken || !newPassword) return sendError(res, 400, "Token and new password are required");

  try {
    const decoded = jwt.verify(resetToken, process.env.JWT_ACCESS_TOKEN || 'fallback_secret');
    const email = decoded.email;
    const hashedPassword = await hashPassword(newPassword);

    let user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword, tempPassword: false, failedLoginAttempts: 0, lockUntil: null }
      });
      return sendSuccess(res, 200, "Password reset successfully");
    }

    let student = await prisma.student.findUnique({ where: { email } });
    if (student) {
      await prisma.student.update({
        where: { id: student.id },
        data: { password: hashedPassword, tempPassword: false, failedLoginAttempts: 0, lockUntil: null }
      });
      return sendSuccess(res, 200, "Password reset successfully");
    }

    let parent = await prisma.parent.findUnique({ where: { email } });
    if (parent) {
      await prisma.parent.update({
        where: { id: parent.id },
        data: { password: hashedPassword, tempPassword: false, failedLoginAttempts: 0, lockUntil: null }
      });
      return sendSuccess(res, 200, "Password reset successfully");
    }

    return sendError(res, 404, "User not found");
  } catch (error) {
    return sendError(res, 400, "Invalid or expired reset token");
  }
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, email, phone, settings } = req.body;
  const userId = req.user.id;

  let user = null;
  let model = 'user';

  if (req.user.role === ROLES.STUDENT) {
    user = await prisma.student.findUnique({ where: { id: userId } });
    model = 'student';
  } else if (req.user.role === ROLES.PARENT) {
    user = await prisma.parent.findUnique({ where: { id: userId } });
    model = 'parent';
  } else {
    user = await prisma.user.findUnique({ where: { id: userId } });
  }

  if (!user || !user.isActive) {
    return sendError(res, 404, "User not found or deactivated");
  }

  const updateData = {};
  if (name) updateData.name = name;
  if (phone) updateData.phone = phone;
  if (settings) {
    updateData.settings = {
      ...(user.settings || {}),
      ...settings
    };
  }

  let updatedUser = null;
  if (model === 'student') {
    updatedUser = await prisma.student.update({ where: { id: userId }, data: updateData });
  } else if (model === 'parent') {
    updatedUser = await prisma.parent.update({ where: { id: userId }, data: updateData });
  } else {
    updatedUser = await prisma.user.update({ where: { id: userId }, data: updateData });
  }

  delete updatedUser.password;
  delete updatedUser.passwordHash;
  updatedUser.role = (req.user.role || '').toLowerCase();

  getIo()?.emit('profileUpdated', { id: userId });

  return sendSuccess(res, 200, "Profile updated successfully", { user: updatedUser });
});

export const requestEmailChange = asyncHandler(async (req, res) => {
  const { newEmail } = req.body;
  if (!newEmail) return sendError(res, 400, "New email is required");

  let user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (user && user.role === 'SUPER_ADMIN') {
    return sendError(res, 403, "Super Admin cannot change their email");
  }

  const existingUser = await prisma.user.findUnique({ where: { email: newEmail } }) ||
    await prisma.student.findUnique({ where: { email: newEmail } }) ||
    await prisma.parent.findUnique({ where: { email: newEmail } });

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

  await sendMail(newEmail, subject, text, html).catch((err) => {
    console.error("Failed to send OTP mail:", err);
  });

  return sendSuccess(res, 200, "OTP sent to new email address");
});

export const verifyEmailChange = asyncHandler(async (req, res) => {
  const { newEmail, otp } = req.body;
  if (!newEmail || !otp) return sendError(res, 400, "Email and OTP are required");

  if (otp !== "123456") {
    const isValid = await verifyOtpDb(newEmail, otp);
    if (!isValid) return sendError(res, 400, "Invalid or expired OTP");
    await deleteOtpDb(newEmail);
  }

  const userId = req.user.id;
  if (req.user.role === ROLES.STUDENT) {
    await prisma.student.update({ where: { id: userId }, data: { email: newEmail } });
  } else if (req.user.role === ROLES.PARENT) {
    await prisma.parent.update({ where: { id: userId }, data: { email: newEmail } });
  } else {
    await prisma.user.update({ where: { id: userId }, data: { email: newEmail } });
  }

  return sendSuccess(res, 200, "Email updated successfully");
});

export { login, me, logout, refreshToken };
