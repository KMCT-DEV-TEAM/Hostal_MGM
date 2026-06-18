import api from '@/services/axios';

const organizationApi = {
  createOrganization: (payload) =>
    api.post("/organizations", payload),

  getOrganizations: (params) =>
    api.get("/organizations", { params }),

  getOrganizationById: (id) =>
    api.get(`/organizations/${id}`),

  updateOrganization: (id, payload) =>
    api.patch(`/organizations/${id}`, payload),

  toggleStatus: (id) =>
    api.patch(`/organizations/${id}/toggle-status`),

  bulkToggleStatus: ({ids, isActive}) =>
    api.patch("/organizations/bulk-status", {ids, isActive}),
};

export default organizationApi;
