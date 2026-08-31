import api from '@/services/axios';

const hostelApi = {
  createHostel: (payload) =>
    api.post("/super-admin/hostels", payload),

  getHostels: (params) =>
    api.get("/super-admin/hostels", { params }),

  getSelectionHostels: (params) =>
    api.get("/super-admin/hostels/selection", { params }),

  getHostelById: (id) =>
    api.get(`/super-admin/hostels/${id}`),

  updateHostel: (id, payload) =>
    api.patch(`/super-admin/hostels/${id}`, payload),

  toggleStatus: (id, payload) =>
    api.patch(`/super-admin/hostels/${id}/toggle-status`, payload),

  bulkToggleStatus: ({ ids, isActive }) =>
    api.patch("/super-admin/hostels/bulk-status", { ids, isActive }),
};

export default hostelApi;
