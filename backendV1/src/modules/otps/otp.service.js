import { prisma } from '../../config/prisma.js';

const generateOtp = () => {
  // Generate a 6-digit random OTP
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const getOrCreateOtp = async (email) => {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const existingOtp = await prisma.otp.findFirst({
    where: {
      email,
      createdAt: { gte: fiveMinutesAgo }
    }
  });

  if (existingOtp) {
    return { otpCode: existingOtp.otp, isExisting: true };
  }

  const otpCode = generateOtp();
  await saveOtpDb(email, otpCode);

  return { otpCode, isExisting: false };
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

export { generateOtp, getOrCreateOtp, saveOtpDb, verifyOtpDb, deleteOtpDb };
