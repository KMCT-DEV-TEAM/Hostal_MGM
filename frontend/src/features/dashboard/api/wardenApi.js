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

  toggleStatus: (id) =>
    api.patch(`/super-admin/wardens/${id}/toggle-status`),
};

export default wardenApi;
