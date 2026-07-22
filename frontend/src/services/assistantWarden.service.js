import assistantWardenApi from '@/features/dashboard/api/assistantWardenApi';

/**
 * Create a new Warden
 * @param {Object} payload 
 */
export async function createAssistantWarden(payload) {
  const response = await assistantWardenApi.createAssistantWarden(payload);
  return response.data;
}

/**
 * Fetch a list of Wardens
 * @param {Object} params - e.g. { page: 1, limit: 10 }
 */
export async function getAssistantWardens(params) {
  const response = await assistantWardenApi.getAssistantWardens(params);
  return response.data;
}

/**
 * Fetch a single Warden by ID
 * @param {string} id 
 */
export async function getAssistantWardenById(id) {
  const response = await assistantWardenApi.getAssistantWardenById(id);
  return response.data;
}

/**
 * Update Warden name and phone
 * @param {string} id 
 * @param {Object} payload 
 */
export async function updateAssistantWarden(id, payload) {
  const response = await assistantWardenApi.updateAssistantWarden(id, payload);
  return response.data;
}

export async function updateEmail(id, payload) {
  const response = await assistantWardenApi.updateEmail(id, payload);
  return response.data;
}

export async function updateAssistantWardenHostel(id, payload) {
  const response = await assistantWardenApi.updateAssistantWardenHostel(id, payload);
  return response.data;
}

/**
 * Toggle Warden active/inactive status
 * @param {string} id 
 */
export async function toggleStatus(id) {
  const response = await assistantWardenApi.toggleStatus(id);
  return response.data;
}

/**
 * Bulk toggle status of Wardens
 * @param {Object} payload - { ids: [id1, id2], isActive: boolean }
 */
export async function bulkToggleStatus(payload) {
  const response = await assistantWardenApi.bulkToggleStatus(payload);
  return response.data;
}

/**
 * Fetch Dashboard Stats for Warden
 */
export async function getAssistantWardenDashboardStats() {
  const response = await assistantWardenApi.getAssistantWardenDashboardStats();
  return response.data;
}

const assistantWardenService = {
  createAssistantWarden,
  getAssistantWardens,
  getAssistantWardenById,
  updateAssistantWarden,
  updateEmail,
  updateAssistantWardenHostel,
  toggleStatus,
  bulkToggleStatus,
  getAssistantWardenDashboardStats,
};

export default assistantWardenService;
