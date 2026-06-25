import api from '@/services/axios';

const leaveApi = {
  // Student endpoints
  createLeave: (payload) => api.post("/student/passes/", payload),
  getMyLeaves: (params) => api.get("/student/passes/my-passes", { params }),
  updateLeave: (id, payload) => api.put(`/student/passes/${id}`, payload),
  cancelLeave: (id, payload) => api.patch(`/student/passes/${id}/cancel`, payload),

  // Placeholders for future roles (Admin, Parent, Warden, etc.)
  getLeavesByAdmin: (params) => api.get("/admin/passes", { params }),
  updateLeaveStatusByAdmin: (id, payload) => api.patch(`/admin/passes/${id}/status`, payload),

  getLeavesByParent: (params) => api.get("/parent/passes", { params }),
  approveLeaveByParent: (id, payload) => api.patch(`/parent/passes/${id}/approve`, payload),
  rejectLeaveByParent: (id, payload) => api.patch(`/parent/passes/${id}/reject`, payload),
};

export default leaveApi;
