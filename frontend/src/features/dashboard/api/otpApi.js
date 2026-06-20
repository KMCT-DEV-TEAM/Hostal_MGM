  import api from '@/services/axios';

  const otpApi = {
    sendOtp: (payload) => api.post('/otp/send', payload),
    verifyOtp: (payload) => api.post('/otp/verify', payload),
  };

  export default otpApi;
