import api from '@/services/axios';

const maintenanceStaffApi = {
  createMaintenanceStaff: (payload) =>
    api.post("/super-admin/maintenance-staff", payload),

  getMaintenanceStaff: (params) =>
    api.get("/super-admin/maintenance-staff", { params }),

  updateMaintenanceStaff: (id, payload) =>
    api.patch(`/super-admin/maintenance-staff/${id}`, payload),

  updateEmail: (id, payload) =>
    api.patch(`/super-admin/${id}/email`, payload),

  toggleStatus: (id, payload) =>
    api.patch(`/super-admin/maintenance-staff/${id}/toggle-status`, payload),

  bulkToggleStatus: (payload) =>
    api.post(`/super-admin/maintenance-staff/bulk-toggle-status`, payload),
};

export default maintenanceStaffApi;
