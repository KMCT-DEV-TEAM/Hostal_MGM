import api from '@/services/axios';

const parentApi = {
  getParentDashboardStats: (studentId, params) => api.get(`/parent/dashboard/students/${studentId}/stats`, { params }),

  getParentStudents: (params) => api.get("/parent/students", { params }),

  createParentByAdmin: (payload) =>
    api.post("/parents", payload),

  resolveParentConflictByAdmin: (payload) =>
    api.post("/parents/resolve-conflict", payload),



  updateParent: (id, payload) =>
    api.patch(`/parents/${id}`, payload),

  updateParentByAdmin: (id, payload) =>
    api.patch(`/parents/${id}`, payload),

  updateParentBySuperAdmin: (id, payload) =>
    api.patch(`/parents/${id}`, payload),

  changeParentEmailByAdmin: (id, payload) =>
    api.patch(`/parents/${id}/change-email`, payload),

  changeParentEmailBySuperAdmin: (id, payload) =>
    api.patch(`/parents/${id}/change-email`, payload),

  getParentsByAdmin: (params) =>
    api.get("/parents/admin", { params }),

  exportParentsByAdmin: (params) =>
    api.get("/admin/parents/export/admin", { params }),

  toggleStatusByAdmin: (id) =>
    api.patch(`/admin/parents/${id}/toggle-status`),

  bulkStatusByAdmin: (payload) =>
    api.patch(`/admin/parents/bulk-status`, payload),

  setDefaultGuardianByAdmin: (id) =>
    api.patch(`/admin/parents/${id}/default-guardian`, {
      defaultGuardian: true,
    }),
  //----super admin 
  getParentsBySuperAdmin: (params) =>
    api.get("/parents/super-admin", { params }),

  exportParentsBySuperAdmin: (params) =>
    api.get("/admin/parents/export/super-admin", { params }),

  toggleStatusBySuperAdmin: (id) =>
    api.patch(`/parents/${id}/toggle-status`), // Assuming it's mounted under /admin/parents in app.js

  bulkStatusBySuperAdmin: (payload) =>
    api.patch(`/parents/bulk-status`, payload),

  createParentBySuperAdmin: (payload) =>
    api.post("/parents", payload),

  resolveParentConflictBySuperAdmin: (payload) =>
    api.post("/parents/resolve-conflict", payload),

  setDefaultGuardianBySuperAdmin: (id) =>
    api.patch(`/parents/${id}/default-guardian`, {
      defaultGuardian: true,
    }),

  getParentsByWarden: (params) =>
    api.get("/warden/parents/warden", { params }),

  getParentsByMentor: (params) =>
    api.get("/admin/parents/mentor", { params }),

};

export default parentApi;
