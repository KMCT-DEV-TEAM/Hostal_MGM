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

  updateOrganization: (id, payload) =>
    api.patch(`/super-admin/admins/${id}/organization`, payload),
};

export default adminApi;
