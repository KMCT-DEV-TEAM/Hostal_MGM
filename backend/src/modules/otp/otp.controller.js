import asyncHandler from "../../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../../utils/response.js";
import { generateOtp, saveOtpDb, verifyOtpDb, deleteOtpDb } from "./otp.service.js";
import { sendMail } from "../../utils/mailer.js";

const sendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return sendError(res, 400, "Email is required");
  }

  const otpCode = generateOtp();
  await saveOtpDb(email, otpCode);

  const subject = "Your OTP Code for Verification";
  const text = `Your OTP code is: ${otpCode}. It will expire in 5 minutes.`;
  const html = `<p>Your OTP code is: <strong>${otpCode}</strong></p><p>It will expire in 5 minutes.</p>`;

  try {
    await sendMail(email, subject, text, html);
    return sendSuccess(res, 200, "OTP sent successfully to email");
  } catch (error) {
    return sendError(res, 500, "Failed to send email");
  }
});

const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return sendError(res, 400, "Email and OTP are required");
  }

  const isValid = await verifyOtpDb(email, otp);

  if (!isValid) {
    return sendError(res, 400, "Invalid or expired OTP");
  }

  // OTP is valid, remove it from DB
  // await deleteOtpDb(email);

  return sendSuccess(res, 200, "OTP verified successfully");
});

export { sendOtp, verifyOtp };
