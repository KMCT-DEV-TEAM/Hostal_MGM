import { prisma } from '../../config/prisma.js';

export const OTP_EXPIRATION = {
  DEFAULT: 5,
  AUTH: 5,
  STUDENT_CREATION: 15,
  PARENT_VERIFICATION: 15,
  PASSWORD_RESET: 5,
};

export const getExpiryMinutesForPurpose = (purpose = 'DEFAULT') => {
  const key = purpose?.toString().toUpperCase() || 'DEFAULT';
  return OTP_EXPIRATION[key] ?? OTP_EXPIRATION.DEFAULT;
};

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const cleanupExpiredOtps = async () => {
  try {
    await prisma.otp.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  } catch (error) {
    console.error('Failed to clean up expired OTPs:', error);
  }
};

const saveOtpDb = async (email, otpCode, purpose = 'DEFAULT') => {
  const normalizedPurpose = purpose?.toString().toUpperCase() || 'DEFAULT';

  // Delete existing OTP for this email + purpose
  await prisma.otp.deleteMany({
    where: {
      email,
      purpose: normalizedPurpose,
    },
  });

  const expiresInMinutes = getExpiryMinutesForPurpose(normalizedPurpose);

  const expiresAt = new Date(
    Date.now() + expiresInMinutes * 60 * 1000
  );

  return await prisma.otp.create({
    data: {
      email,
      otp: otpCode,
      purpose: normalizedPurpose,
      expiresAt,
    },
  });
};

const getOrCreateOtp = async (email, purpose = 'DEFAULT') => {
  await cleanupExpiredOtps();

  const normalizedPurpose = purpose?.toString().toUpperCase() || 'DEFAULT';
  const now = new Date();

  const existingOtp = await prisma.otp.findFirst({
    where: {
      email,
      purpose: normalizedPurpose,
      expiresAt: {
        gte: now,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (existingOtp) {
    const remainingSeconds = Math.max(
      0,
      Math.floor(
        (new Date(existingOtp.expiresAt).getTime() - Date.now()) / 1000
      )
    );

    return {
      otpCode: existingOtp.otp,
      isExisting: true,
      remainingSeconds,
      createdAt: existingOtp.createdAt,
      expiresInMinutes: getExpiryMinutesForPurpose(normalizedPurpose),
      purpose: normalizedPurpose,
    };
  }

  const otpCode = generateOtp();

  await saveOtpDb(
    email,
    otpCode,
    normalizedPurpose
  );

  const expiresInMinutes =
    getExpiryMinutesForPurpose(normalizedPurpose);

  return {
    otpCode,
    isExisting: false,
    remainingSeconds: expiresInMinutes * 60,
    expiresInMinutes,
    purpose: normalizedPurpose,
  };
};

const verifyOtpDb = async (
  email,
  otpCode,
  purpose = null
) => {
  const normalizedPurpose = purpose
    ? purpose.toString().toUpperCase()
    : null;

  const whereClause = {
    email,
    otp: otpCode,
    expiresAt: {
      gte: new Date(),
    },
  };

  if (normalizedPurpose) {
    whereClause.purpose = normalizedPurpose;
  }

  const otpRecord = await prisma.otp.findFirst({
    where: whereClause,
    orderBy: {
      createdAt: 'desc',
    },
  });

  return !!otpRecord;
};

const deleteOtpDb = async (email, purpose = null) => {
  const whereClause = {
    email,
  };

  if (purpose) {
    whereClause.purpose = purpose.toString().toUpperCase();
  }

  return await prisma.otp.deleteMany({
    where: whereClause,
  });
};

export {
  generateOtp,
  getOrCreateOtp,
  saveOtpDb,
  verifyOtpDb,
  deleteOtpDb,
  cleanupExpiredOtps,
};