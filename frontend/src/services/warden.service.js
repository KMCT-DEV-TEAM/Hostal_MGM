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

/**
 * Toggle Warden active/inactive status
 * @param {string} id 
 */
export async function toggleStatus(id) {
  const response = await wardenApi.toggleStatus(id);
  return response.data;
}

const wardenService = {
  createWarden,
  getWardens,
  getWardenById,
  updateWarden,
  toggleStatus,
};

export default wardenService;
