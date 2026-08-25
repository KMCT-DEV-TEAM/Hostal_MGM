import { generateAccessToken, generateRefreshToken } from "../../utils/jwt.js";
import { sendSuccess, sendError } from "../../utils/response.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { comparePassword, hashPassword } from "../../utils/hash.js";
import { prisma } from "../../config/prisma.js";
import jwt from "jsonwebtoken";

const refreshTokenCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
};

const login = asyncHandler(async (req, res) => {
  const { email, password, role } = req.body;

  if (!['super_admin', 'admin', 'warden', 'assistant_warden', 'student', 'parent', 'maintenance_staff'].includes(role)) {
    return sendError(res, 400, "Invalid login portal");
  }

  let user = null;
  let dbRole = null;
  let modelName = '';

  if (role === 'student') {
    user = await prisma.student.findUnique({ where: { email } });
    dbRole = 'STUDENT';
    modelName = 'student';
  } else if (role === 'parent') {
    user = await prisma.parent.findUnique({ where: { email } });
    dbRole = 'PARENT';
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
  if (role === 'super_admin' && user.role !== 'SUPER_ADMIN') {
    return sendError(res, 401, "You are not authorized to login as Super Admin. Check URL");
  }
  if (role === 'admin' && !['ADMIN', 'WARDEN', 'MENTOR'].includes(user.role)) {
    return sendError(res, 401, "You are not authorized to login from here. Check URL");
  }
  if (role === 'warden' && user.role !== 'WARDEN') {
    return sendError(res, 401, "You are not authorized to login as Warden. Check URL");
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

const me = asyncHandler(async (req, res) => {
  let user = null;

  if (req.user.role === 'STUDENT' || req.user.role === 'student') {
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
        user.role = 'student';
        const activeAllocation = user.studentHostels?.[0];
        
        if (activeAllocation?.hostel) {
            user.assignedHostels = [{
              _id: activeAllocation.hostel.id,
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
  } else if (req.user.role === 'PARENT' || req.user.role === 'parent') {
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
      user.role = 'parent';
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
        if (user.role === 'WARDEN') {
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

  if (req.user.role === 'STUDENT' || req.user.role === 'student') {
    user = await prisma.student.findUnique({ where: { id: userId } });
    model = 'student';
  } else if (req.user.role === 'PARENT' || req.user.role === 'parent') {
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

  if (req.user.role === 'STUDENT' || req.user.role === 'student') {
    user = await prisma.student.findUnique({ where: { id: req.user.id } });
  } else if (req.user.role === 'PARENT' || req.user.role === 'parent') {
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

export { login, me, logout };
