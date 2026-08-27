import maintenanceStaffApi from '@/features/dashboard/api/maintenanceStaffApi';

export async function createMaintenanceStaff(payload) {
  const response = await maintenanceStaffApi.createMaintenanceStaff(payload);
  return response.data;
}

export async function getMaintenanceStaff(params) {
  const response = await maintenanceStaffApi.getMaintenanceStaff(params);
  return response.data;
}

export async function updateMaintenanceStaff(id, payload) {
  const response = await maintenanceStaffApi.updateMaintenanceStaff(id, payload);
  return response.data;
}

export async function updateEmail(id, payload) {
  const response = await maintenanceStaffApi.updateEmail(id, payload);
  return response.data;
}

export async function toggleStatus(id, payload) {
  const response = await maintenanceStaffApi.toggleStatus(id, payload);
  return response.data;
}

export async function bulkToggleStatus(payload) {
  const response = await maintenanceStaffApi.bulkToggleStatus(payload);
  return response.data;
}

const maintenanceStaffService = {
  createMaintenanceStaff,
  getMaintenanceStaff,
  updateMaintenanceStaff,
  updateEmail,
  toggleStatus,
  bulkToggleStatus,
};

export default maintenanceStaffService;
