import api from '@/services/axios';

const leaveApi = {
  // Student & Unified endpoints
  createLeave: (payload) => api.post("/passes", payload),
  getLeaves: (params) => api.get("/passes", { params }),
  
  // Role-specific lists
  getParentList: (params) => api.get("/passes/parent-list", { params }),
  getWardenList: (params) => api.get("/passes/warden-list", { params }),
  
  // Management endpoints (Admin, Super Admin, Mentor)
  getManagementHostels: (params) => api.get("/passes/hostels", { params }),
  getManagementHostelLeaves: (hostelId, params) => {
    if (hostelId) {
      return api.get(`/passes/hostels/${hostelId}`, { params });
    }
    return api.get("/passes/hostels/all", { params }); // Fallback if no hostelId provided
  },
  getDashboardStats: (params) => api.get("/passes/dashboard", { params }),
  
  // Single pass endpoints
  getLeaveById: (id) => api.get(`/passes/${id}`),
  updateLeave: (id, payload) => api.put(`/passes/${id}`, payload),
  cancelLeave: (id, payload) => api.put(`/passes/${id}/cancel`, payload),
  
  // Actions
  approveLeave: (id, payload) => api.patch(`/passes/${id}/approve`, payload),
  rejectLeave: (id, payload) => api.patch(`/passes/${id}/reject`, payload),
  markStudentLeft: (id) => api.patch(`/passes/${id}/mark-left`),
  markStudentReturned: (id) => api.patch(`/passes/${id}/mark-returned`),
};

export default leaveApi;
