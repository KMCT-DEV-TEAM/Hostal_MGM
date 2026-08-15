import asyncHandler from '../../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { prisma } from '../../config/prisma.js';
import { sendMail } from '../../utils/mailer.js';

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return sendError(res, 400, "Email is required");
  }

  // Delete any existing OTP for this email
  await prisma.otp.deleteMany({
    where: { email }
  });

  const otpCode = generateOtp();
  await prisma.otp.create({
    data: {
      email,
      otp: otpCode,
    }
  });

  const subject = "Your OTP Code for Verification";
  const text = `Your OTP code is: ${otpCode}. It will expire in 5 minutes.`;
  const html = `<p>Your OTP code is: <strong>${otpCode}</strong></p><p>It will expire in 5 minutes.</p>`;

  try {
    await sendMail(email, subject, text, html);
    return sendSuccess(res, 200, "OTP sent successfully to email");
  } catch (error) {
    console.error("Failed to send OTP email:", error);
    return sendError(res, 500, "Failed to send email");
  }
});

export const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return sendError(res, 400, "Email and OTP are required");
  }

  const otpRecord = await prisma.otp.findFirst({
    where: { email },
    orderBy: { createdAt: 'desc' }
  });

  if (!otpRecord || otpRecord.otp !== otp) {
    return sendError(res, 400, "Invalid or expired OTP");
  }

  // Optional: check expiration (e.g., 5 mins)
  const isExpired = new Date(otpRecord.createdAt).getTime() + 5 * 60 * 1000 < Date.now();
  if (isExpired) {
    return sendError(res, 400, "OTP has expired");
  }

  // Delete after successful verification
  await prisma.otp.deleteMany({
    where: { email }
  });

  return sendSuccess(res, 200, "OTP verified successfully");
});
