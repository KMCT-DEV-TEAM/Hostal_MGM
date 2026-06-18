import wardenApi from '@/features/dashboard/api/wardenApi';

/**
 * Create a new Warden
 * @param {Object} payload 
 */
export async function createWarden(payload) {
  const response = await wardenApi.createWarden(payload);
  return response.data;
}

/**
 * Fetch a list of Wardens
 * @param {Object} params - e.g. { page: 1, limit: 10 }
 */
export async function getWardens(params) {
  const response = await wardenApi.getWardens(params);
  return response.data;
}

/**
 * Fetch a single Warden by ID
 * @param {string} id 
 */
export async function getWardenById(id) {
  const response = await wardenApi.getWardenById(id);
  return response.data;
}

/**
 * Update Warden name and phone
 * @param {string} id 
 * @param {Object} payload 
 */
export async function updateWarden(id, payload) {
  const response = await wardenApi.updateWarden(id, payload);
  return response.data;
}

export async function updateEmail(id, payload) {
  const response = await wardenApi.updateEmail(id, payload);
  return response.data;
}

export async function updateWardenHostel(id, payload) {
  const response = await wardenApi.updateWardenHostel(id, payload);
  return response.data;
}

/**
 * Toggle Warden active/inactive status
 * @param {string} id 
 */
export async function toggleStatus(id) {
  const response = await wardenApi.toggleStatus(id);
  return response.data;
}

/**
 * Bulk toggle status of Wardens
 * @param {Object} payload - { ids: [id1, id2], isActive: boolean }
 */
export async function bulkToggleStatus(payload) {
  const response = await wardenApi.bulkToggleStatus(payload);
  return response.data;
}

/**
 * Fetch Dashboard Stats for Warden
 */
export async function getWardenDashboardStats() {
  const response = await wardenApi.getWardenDashboardStats();
  return response.data;
}

const wardenService = {
  createWarden,
  getWardens,
  getWardenById,
  updateWarden,
  updateEmail,
  updateWardenHostel,
  toggleStatus,
  bulkToggleStatus,
  getWardenDashboardStats,
};

export default wardenService;
