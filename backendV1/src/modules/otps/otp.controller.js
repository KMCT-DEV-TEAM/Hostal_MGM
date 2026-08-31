import asyncHandler from '../../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { getOrCreateOtp, verifyOtpDb, deleteOtpDb } from './otp.service.js';
import { sendMail } from '../../utils/mailer.js';

export const sendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return sendError(res, 400, "Email is required");
  }

  const { otpCode, isExisting, remainingSeconds } = await getOrCreateOtp(email);
  if (isExisting) {
    const remainingMinutes = Math.ceil(remainingSeconds / 60);
    return sendError(
      res,
      400,
      `An active OTP already exists for this email. Please check your inbox or wait ${remainingSeconds}s (${remainingMinutes} min) before requesting a new one.`,
      { isExisting: true, remainingSeconds }
    );
  }

  const subject = "Your OTP Code for Verification";
  const text = `Your OTP code is: ${otpCode}. It will expire in 5 minutes.`;
  const html = `<p>Your OTP code is: <strong>${otpCode}</strong></p><p>It will expire in 5 minutes.</p>`;

  try {
    await sendMail(email, subject, text, html);
    return sendSuccess(res, 200, "OTP sent successfully to email");
  } catch (error) {
    // If email sending fails, delete the OTP so the user can retry immediately
    await deleteOtpDb(email);
    console.error("Failed to send email:", error);
    return sendError(res, 500, error.message || "Failed to send email");
  }
});

export const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return sendError(res, 400, "Email and OTP are required");
  }

  const isValid = await verifyOtpDb(email, otp);

  if (!isValid) {
    return sendError(res, 400, "Invalid or expired OTP");
  }

  return sendSuccess(res, 200, "OTP verified successfully");
});
