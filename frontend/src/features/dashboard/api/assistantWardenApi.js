import api from '@/services/axios';

const assistantWardenApi = {
  createAssistantWarden: (payload) =>
    api.post("/super-admin/assistant-wardens", payload),

  getAssistantWardens: (params) =>
    api.get("/super-admin/assistant-wardens/", { params }),

  getAssistantWardenById: (id) =>
    api.get(`/super-admin/assistant-wardens/${id}`),

  updateAssistantWarden: (id, payload) =>
    api.patch(`/super-admin/assistant-wardens/${id}`, payload),

  updateEmail: (id, payload) =>
    api.patch(`/super-admin/${id}/email`, payload),

  updateAssistantWardenHostel: (id, payload) =>
    api.patch(`/super-admin/assistant-wardens/${id}/hostel`, payload),

  toggleStatus: (id, payload) =>
    api.patch(`/super-admin/assistant-wardens/${id}/toggle-status`, payload),

  bulkToggleStatus: (payload) =>
    api.post("/super-admin/assistant-wardens/bulk-toggle-status", payload),

  getAssistantWardenDashboardStats: () =>
    api.get("/warden/dashboard-summary"),
};

export default assistantWardenApi;
