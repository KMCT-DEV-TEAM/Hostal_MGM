import api from '@/services/axios';

const parentApi = {
  getParentDashboardStats: (params) => api.get("/parent/dashboard/parent/stats", { params }),

  createParentByAdmin: (payload) =>
    api.post("/admin/parents", payload),



  updateParent: (id, payload) =>
    api.patch(`/admin/parents/${id}`, payload),

  updateParentByAdmin: (id, payload) =>
    api.patch(`/admin/parents/${id}`, payload),

  updateParentBySuperAdmin: (id, payload) =>
    api.patch(`/super-admin/parents/${id}`, payload),

  changeParentEmailByAdmin: (id, payload) =>
    api.patch(`/admin/parents/${id}/change-email`, payload),

  changeParentEmailBySuperAdmin: (id, payload) =>
    api.patch(`/super-admin/parents/${id}/change-email`, payload),

  getParentsByAdmin: (params) =>
    api.get("/admin/parents/admin", { params }),

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
    api.get("/super-admin/parents/super-admin", { params }),

  exportParentsBySuperAdmin: (params) =>
    api.get("/admin/parents/export/super-admin", { params }),

  toggleStatusBySuperAdmin: (id) =>
    api.patch(`/super-admin/parents/${id}/toggle-status`), // Assuming it's mounted under /admin/parents in app.js

  bulkStatusBySuperAdmin: (payload) =>
    api.patch(`/super-admin/parents/bulk-status`, payload),

  createParentBySuperAdmin: (payload) =>
    api.post("/super-admin/parents", payload),

  setDefaultGuardianBySuperAdmin: (id) =>
    api.patch(`/super-admin/parents/${id}/default-guardian`, {
      defaultGuardian: true,
    }),

  getParentsByWarden: (params) =>
    api.get("/warden/parents/warden", { params }),

  getParentsByMentor: (params) =>
    api.get("/admin/parents/mentor", { params }),

};

export default parentApi;
