import asyncHandler from '../../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { prisma } from '../../config/prisma.js';
import { sendMail } from '../../utils/mailer.js';

export const sendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return sendError(res, 400, "Email is required");
  }

  // Check if unexpired OTP already exists (e.g. created within last 5 mins)
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const existingOtp = await prisma.otp.findFirst({
    where: {
      email,
      createdAt: { gte: fiveMinutesAgo }
    }
  });

  if (existingOtp) {
    return sendError(res, 400, "OTP already sent. Please wait for it to expire before requesting a new one.");
  }

  // Generate 6-digit OTP
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

  // Create OTP in DB
  await prisma.otp.create({
    data: {
      email,
      otp: otpCode
    }
  });

  const subject = "Your OTP Code for Verification";
  const text = `Your OTP code is: ${otpCode}. It will expire in 5 minutes.`;
  const html = `<p>Your OTP code is: <strong>${otpCode}</strong></p><p>It will expire in 5 minutes.</p>`;

  try {
    await sendMail(email, subject, text, html);
    return sendSuccess(res, 200, "OTP sent successfully to email");
  } catch (error) {
    // If email sending fails, delete the OTP so they can try again
    await prisma.otp.deleteMany({ where: { email, otp: otpCode } });
    console.error("Failed to send email:", error);
    return sendError(res, 500, "Failed to send email");
  }
});

export const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return sendError(res, 400, "Email and OTP are required");
  }

  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const existingOtp = await prisma.otp.findFirst({
    where: {
      email,
      otp,
      createdAt: { gte: fiveMinutesAgo }
    }
  });

  if (!existingOtp) {
    return sendError(res, 400, "Invalid or expired OTP");
  }

  // Delete the OTP after successful verification
  await prisma.otp.deleteMany({ where: { email } });

  return sendSuccess(res, 200, "OTP verified successfully");
});
