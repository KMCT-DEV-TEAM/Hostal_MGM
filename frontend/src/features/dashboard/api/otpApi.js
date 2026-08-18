  import api from '@/services/axios';

  const otpApi = {
    sendOtp: (payload) => api.post('/otps/send', payload),
    verifyOtp: (payload) => api.post('/otps/verify', payload),
  };

  export default otpApi;
