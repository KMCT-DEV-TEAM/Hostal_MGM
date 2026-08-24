import { prisma } from '../../config/prisma.js';

const generateOtp = () => {
  // Generate a 6-digit random OTP
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const cleanupExpiredOtps = async () => {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    await prisma.otp.deleteMany({
      where: {
        createdAt: { lt: fiveMinutesAgo }
      }
    });
  } catch (error) {
    console.error("Failed to clean up expired OTPs:", error);
  }
};

const getOrCreateOtp = async (email) => {
  await cleanupExpiredOtps();

  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const existingOtp = await prisma.otp.findFirst({
    where: {
      email,
      createdAt: { gte: fiveMinutesAgo }
    }
  });

  if (existingOtp) {
    const elapsedSeconds = Math.floor((Date.now() - new Date(existingOtp.createdAt).getTime()) / 1000);
    const remainingSeconds = Math.max(0, 300 - elapsedSeconds);
    return { otpCode: existingOtp.otp, isExisting: true, remainingSeconds, createdAt: existingOtp.createdAt };
  }

  const otpCode = generateOtp();
  await saveOtpDb(email, otpCode);

  return { otpCode, isExisting: false, remainingSeconds: 300 };
};

const saveOtpDb = async (email, otpCode) => {
  // Delete any existing OTP for this email to prevent multiple valid OTPs
  await prisma.otp.deleteMany({ where: { email } });

  return await prisma.otp.create({
    data: {
      email,
      otp: otpCode,
    }
  });
};

const verifyOtpDb = async (email, otpCode) => {
  await cleanupExpiredOtps();

  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const otpRecord = await prisma.otp.findFirst({
    where: {
      email,
      otp: otpCode,
      createdAt: { gte: fiveMinutesAgo }
    }
  });

  if (!otpRecord) return false;
  if (otpRecord.otp !== otpCode) return false;

  return true;
};

const deleteOtpDb = async (email) => {
  return await prisma.otp.deleteMany({ where: { email } });
};


export { generateOtp, getOrCreateOtp, saveOtpDb, verifyOtpDb, deleteOtpDb, cleanupExpiredOtps };
