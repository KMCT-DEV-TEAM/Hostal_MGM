import api from '@/services/axios';

export const passwordRequestApi = {
  verifyEmail: (data) => api.post('/auth/verify-email', data),
  submitPasswordRequest: (data) => api.post('/auth/password-request', data),
  
  getPasswordRequests: (params) => api.get('/super-admin/password-requests', { params }),
  approvePasswordRequest: (id) => api.patch(`/super-admin/password-requests/${id}/approve`),
  rejectPasswordRequest: (id) => api.patch(`/super-admin/password-requests/${id}/reject`),
};
