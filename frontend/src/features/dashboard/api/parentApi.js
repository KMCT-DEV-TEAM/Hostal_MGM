import api from '@/services/axios';

const parentApi = {
  createParent: (payload) =>
    api.post("/admin/parents", payload),

  updateParent: (id, payload) =>
    api.patch(`/admin/parents/${id}`, payload),

  getParentsByAdmin: (params) =>
    api.get("/admin/parents/admin", { params }),

  toggleStatusByAdmin: (id) =>
    api.patch(`/admin/parents/${id}/toggle-status`),

  //----super admin 
  getParentsBySuperAdmin: (params) =>
    api.get("/admin/parents/super-admin", { params }),

  toggleStatusBySuperAdmin: (id) =>
    api.patch(`/admin/parents/${id}/toggle-status`), // Assuming it's mounted under /admin/parents in app.js
};

export default parentApi;
