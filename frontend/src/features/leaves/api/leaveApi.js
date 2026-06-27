import api from '@/services/axios';

const leaveApi = {
  // Student endpoints
  createLeave: (payload) => api.post("/student/passes/", payload),
  getMyLeaves: (params) => api.get("/student/passes/my-passes", { params }),
  updateLeave: (id, payload) => api.put(`/student/passes/${id}`, payload),
  cancelLeave: (id, payload) => api.patch(`/student/passes/${id}/cancel`, payload),
  getLeaveById: (id) => api.get(`/student/passes/${id}`),

  // Admin
  getAdminHostels: (params) => api.get("/admin/passes/hostels", { params }),
  getLeavesByAdmin: (params) => {
    const { hostelId, ...rest } = params;
    return api.get(`/admin/passes/hostels/${hostelId}`, { params: rest });
  },
  getLeaveByIdAdmin: (id) => api.get(`/admin/passes/${id}`),
  updateLeaveStatusByAdmin: (id, payload) => api.patch(`/admin/passes/${id}/status`, payload),
  approveLeaveByAdmin: (id, payload) => api.patch(`/admin/passes/${id}/approve`, payload),
  rejectLeaveByAdmin: (id, payload) => api.patch(`/admin/passes/${id}/reject`, payload),

  // Super Admin
  getSuperAdminHostels: (params) => api.get("/super-admin/passes/hostels", { params }),
  getLeavesBySuperAdmin: (params) => {
    const { hostelId, ...rest } = params;
    return api.get(`/super-admin/passes/hostels/${hostelId}`, { params: rest });
  },

  getLeavesByParent: (params) => api.get("/parent/passes", { params }),
  getLeaveByIdParent: (id) => api.get(`/parent/passes/${id}`),
  approveLeaveByParent: (id, payload) => api.patch(`/parent/passes/${id}/approve`, payload),
  rejectLeaveByParent: (id, payload) => api.patch(`/parent/passes/${id}/reject`, payload),

  // Warden
  getLeavesByWarden: (params) => api.get("/warden/passes", { params }),
  getLeaveByIdWarden: (id) => api.get(`/warden/passes/${id}`),
  markStudentLeft: (id) => api.patch(`/warden/passes/${id}/mark-left`),
  markStudentReturned: (id) => api.patch(`/warden/passes/${id}/mark-returned`),
};

export default leaveApi;
