import Otp from "./otp.model.js";

const generateOtp = () => {
  // Generate a 6-digit random OTP
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const saveOtpDb = async (email, otpCode) => {
  // Delete any existing OTP for this email to prevent multiple valid OTPs
  await Otp.deleteMany({ email });

  const newOtp = new Otp({ email, otp: otpCode });
  return await newOtp.save();
};

const verifyOtpDb = async (email, otpCode) => {
  const otpRecord = await Otp.findOne({ email });

  if (!otpRecord) return false;
  if (otpRecord.otp !== otpCode) return false;

  return true;
};

const deleteOtpDb = async (email) => {
  return await Otp.deleteMany({ email });
};

export { generateOtp, saveOtpDb, verifyOtpDb, deleteOtpDb };
