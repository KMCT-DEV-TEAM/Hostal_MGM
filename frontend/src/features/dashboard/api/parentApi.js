import api from '@/services/axios';

const parentApi = {
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

  toggleStatusByAdmin: (id) =>
    api.patch(`/admin/parents/${id}/toggle-status`),

  setDefaultGuardianByAdmin: (id) =>
    api.patch(`/admin/parents/${id}/default-guardian`, {
      defaultGuardian: true,
    }),
  //----super admin 
  getParentsBySuperAdmin: (params) =>
    api.get("/super-admin/parents/super-admin", { params }),

  toggleStatusBySuperAdmin: (id) =>
    api.patch(`/super-admin/parents/${id}/toggle-status`),

  createParentBySuperAdmin: (payload) =>
    api.post("/super-admin/parents", payload),

  setDefaultGuardianBySuperAdmin: (id) =>
    api.patch(`/super-admin/parents/${id}/default-guardian`, {
      defaultGuardian: true,
    }),

};

export default parentApi;
