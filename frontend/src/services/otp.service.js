import otpApi from '@/features/dashboard/api/otpApi';

export async function sendOtp(email) {
  const response = await otpApi.sendOtp({ email });
  return response.data;
}

export async function verifyOtp(email, otp) {
  const response = await otpApi.verifyOtp({ email, otp });
  return response.data;
}

const otpService = {
  sendOtp,
  verifyOtp,
};

export default otpService;
