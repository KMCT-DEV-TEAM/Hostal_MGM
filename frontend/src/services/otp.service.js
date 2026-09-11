import otpApi from '@/features/dashboard/api/otpApi';

export async function sendOtp(email, purpose = 'DEFAULT') {
  const response = await otpApi.sendOtp({ email, purpose });
  return response.data;
}

export async function verifyOtp(email, otp, purpose = null) {
  const payload = { email, otp };
  if (purpose) payload.purpose = purpose;
  const response = await otpApi.verifyOtp(payload);
  return response.data;
}

const otpService = {
  sendOtp,
  verifyOtp,
};

export default otpService;
