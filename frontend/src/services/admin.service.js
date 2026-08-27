import adminApi from '@/features/dashboard/api/adminApi';

/**
 * Create a new Admin
 * @param {Object} payload 
 */
export async function createAdmin(payload) {
  const response = await adminApi.createAdmin(payload);
  return response.data;
}

/**
 * Fetch a list of Admins with pagination
 * @param {Object} params - e.g. { page: 1, limit: 10 }
 */
export async function getAdmins(params) {
  const response = await adminApi.getAdmins(params);
  return response.data;
}

/**
 * Update Admin name and phone
 * @param {string} id 
 * @param {Object} payload 
 */
export async function updateAdmin(id, payload) {
  const response = await adminApi.updateAdmin(id, payload);
  return response.data;
}

/**
 * Update Admin email
 * @param {string} id 
 * @param {Object} payload 
 */
export async function updateEmail(id, payload) {
  const response = await adminApi.updateEmail(id, payload);
  return response.data;
}

/**
 * Toggle Admin active/inactive status
 * @param {string} id 
 * @param {Object} [payload]
 */
export async function toggleStatus(id, payload) {
  const response = await adminApi.toggleStatus(id, payload);
  return response.data;
}

export async function bulkToggleStatus(payload) {
  const response = await adminApi.bulkToggleStatus(payload);
  return response.data;
}

/**
 * Update Admin Organization
 * @param {string} id 
 * @param {Object} payload 
 */
export async function updateOrganization(id, payload) {
  const response = await adminApi.updateOrganization(id, payload);
  return response.data;
}

/**
 * Fetch Dashboard Stats for Admin
 */
export async function getDashboardStats() {
  const response = await adminApi.getDashboardStats();
  return response.data;
}

/**
 * Fetch Dashboard Stats for Super Admin
 */
export async function getSuperAdminDashboardStats() {
  const response = await adminApi.getSuperAdminDashboardStats();
  return response.data;
}

/**
 * Fetch Student count by Organization for Super Admin chart
 */
export async function getStudentCountByOrganization(params) {
  const response = await adminApi.getStudentCountByOrganization(params);
  return response.data;
}

export async function getAttendanceOverview(params) {
  const response = await adminApi.getAttendanceOverview(params);
  return response.data;
}

const adminService = {
  createAdmin,
  getAdmins,
  updateAdmin,
  updateEmail,
  toggleStatus,
  bulkToggleStatus,
  updateOrganization,
  getDashboardStats,
  getSuperAdminDashboardStats,
  getStudentCountByOrganization,
  getAttendanceOverview,
};

export default adminService;
