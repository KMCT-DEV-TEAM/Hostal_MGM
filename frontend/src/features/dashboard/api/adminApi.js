import api from '@/services/axios';

const adminApi = {
  createAdmin: (payload) =>
    api.post("/super-admin/admins", payload),

  getAdmins: (params) =>
    api.get("/super-admin/admins", { params }),

  updateAdmin: (id, payload) =>
    api.patch(`/super-admin/admins/${id}`, payload),

  updateEmail: (id, payload) =>
    api.patch(`/super-admin/${id}/email`, payload),

  toggleStatus: (id) =>
    api.patch(`/super-admin/admins/${id}/toggle-status`),

  bulkToggleStatus: (payload) =>
    api.post(`/super-admin/admins/bulk-toggle-status`, payload),

  updateOrganization: (id, payload) =>
    api.patch(`/super-admin/admins/${id}/organization`, payload),

  getDashboardStats: () =>
    api.get("/admin/dashboard/stats"),

  getSuperAdminDashboardStats: () =>
    api.get("/super-admin/dashboard/stats"),

  getStudentCountByOrganization: (params) =>
    api.get("/super-admin/dashboard/student-count-by-organization", { params }),

  getAttendanceOverview: (params) =>
    api.get("/super-admin/dashboard/attendance-overview", { params }),
};

export default adminApi;
