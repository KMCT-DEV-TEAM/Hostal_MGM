import api from '@/services/axios';

const leaveApi = {
  // Student endpoints
  createLeave: (payload) => api.post("/student/passes/", payload),
  getMyLeaves: (params) => api.get("/student/passes/my-passes", { params }),
  getUnifiedPasses: (params) => api.get("/student/passes/passes", { params }),
  updateLeave: (id, payload) => api.put(`/student/passes/${id}`, payload),
  cancelLeave: (id, payload) => api.patch(`/student/passes/${id}/cancel`, payload),
  getLeaveById: (id) => api.get(`/student/passes/${id}`),

  // Admin
  getAdminHostels: (params) => api.get("/admin/passes", { params }),
  getAdminDashboardStats: (params) => api.get("/admin/passes/dashboard", { params }),
  getLeavesByAdmin: (params) => {
    const { hostelId, ...rest } = params;
    if (hostelId) {
      return api.get(`/admin/passes/hostels/${hostelId}/passes`, { params: rest });
    }
    return api.get("/admin/passes", { params: rest });
  },
  getLeaveByIdAdmin: (id) => api.get(`/admin/passes/${id}`),
  updateLeaveStatusByAdmin: (id, payload) => api.patch(`/admin/passes/${id}/status`, payload),
  approveLeaveByAdmin: (id, payload) => api.patch(`/admin/passes/${id}/approve`, payload),
  rejectLeaveByAdmin: (id, payload) => api.patch(`/admin/passes/${id}/reject`, payload),
  cancelLeaveByAdmin: (id, payload) => api.put(`/admin/passes/${id}/cancel`, payload),

  // Super Admin
  getSuperAdminHostels: (params) => api.get("/super-admin/passes/hostels", { params }),
  getLeavesBySuperAdmin: (params) => {
    const { hostelId, ...rest } = params;
    return api.get(`/super-admin/passes/hostels/${hostelId}/passes`, { params: rest });
  },
  getLeaveByIdSuperAdmin: (id) => api.get(`/super-admin/passes/${id}`),
  cancelLeaveBySuperAdmin: (id, payload) => api.put(`/super-admin/passes/${id}/cancel`, payload),

  getLeavesByParent: (params) => api.get("/parent/passes", { params }),
  getUnifiedPassesParent: (params) => api.get("/parent/passes/passes", { params }),
  getLeaveByIdParent: (id) => api.get(`/parent/passes/${id}`),
  approveLeaveByParent: (id, payload) => api.patch(`/parent/passes/${id}/approve`, payload),
  rejectLeaveByParent: (id, payload) => api.patch(`/parent/passes/${id}/reject`, payload),

  // Warden
  getWardenDashboardStats: (params) => api.get("/warden/passes/dashboard-stats", { params }),
  getLeavesByWarden: (params) => api.get("/warden/passes", { params }),
  getLeaveByIdWarden: (id) => api.get(`/warden/passes/${id}`),
  markStudentLeft: (id) => api.patch(`/warden/passes/${id}/mark-left`),
  markStudentReturned: (id) => api.patch(`/warden/passes/${id}/mark-returned`),

  // Mentor
  getMentorHostels: (params) => api.get("/mentor/passes/hostels", { params }),
  getMentorDashboardStats: (params) => api.get("/mentor/passes/dashboard", { params }),
  getLeavesByMentor: (params) => {
    const { hostelId, ...rest } = params;
    if (hostelId) {
      return api.get(`/mentor/passes/hostels/${hostelId}/passes`, { params: rest });
    }
    return api.get("/mentor/passes", { params: rest });
  },
  getLeaveByIdMentor: (id) => api.get(`/mentor/passes/${id}`),
  approveLeaveByMentor: (id, payload) => api.patch(`/mentor/passes/${id}/approve`, payload),
  rejectLeaveByMentor: (id, payload) => api.patch(`/mentor/passes/${id}/reject`, payload),
  cancelLeaveByMentor: (id, payload) => api.put(`/mentor/passes/${id}/cancel`, payload),
};

export default leaveApi;
