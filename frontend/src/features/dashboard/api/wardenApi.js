import api from '@/services/axios';

const wardenApi = {
  createWarden: (payload) =>
    api.post("/super-admin/wardens", payload),

  getWardens: (params) =>
    api.get("/super-admin/wardens/", { params }),

  getWardenById: (id) =>
    api.get(`/super-admin/wardens/${id}`),

  updateWarden: (id, payload) =>
    api.patch(`/super-admin/wardens/${id}`, payload),

  updateEmail: (id, payload) =>
    api.patch(`/super-admin/${id}/email`, payload),

  updateWardenHostel: (id, payload) =>
    api.patch(`/super-admin/wardens/${id}/hostel`, payload),

  toggleStatus: (id) =>
    api.patch(`/super-admin/wardens/${id}/toggle-status`),

  bulkToggleStatus: (payload) =>
    api.post("/super-admin/wardens/bulk-toggle-status", payload),

  getWardenDashboardStats: () =>
    api.get("/warden/dashboard/stats"),
};

export default wardenApi;
