import organizationApi from '@/features/dashboard/api/organizationApi';

/**
 * Create a new Organization
 * @param {Object} payload 
 */
export async function createOrganization(payload) {
  const response = await organizationApi.createOrganization(payload);
  return response.data;
}

/**
 * Fetch a list of Organizations
 * @param {Object} params - e.g. { page: 1, limit: 10 }
 */
export async function getOrganizations(params) {
  const response = await organizationApi.getOrganizations(params);
  return response.data;
}

/**
 * Fetch a single Organization by ID
 * @param {string} id 
 */
export async function getOrganizationById(id) {
  const response = await organizationApi.getOrganizationById(id);
  return response.data;
}

/**
 * Update Organization details
 * @param {string} id 
 * @param {Object} payload 
 */
export async function updateOrganization(id, payload) {
  const response = await organizationApi.updateOrganization(id, payload);
  return response.data;
}

/**
 * Toggle Organization active/inactive status
 * @param {string} id 
 */
export async function toggleStatus(id) {
  const response = await organizationApi.toggleStatus(id);
  return response.data;
}

/**
 * Bulk toggle status of Organizations
 * @param {Object} payload - { ids: [id1, id2], isActive: boolean }
 */
export async function bulkToggleStatus({ids, isActive}) {
  const response = await organizationApi.bulkToggleStatus({ids, isActive});
  return response.data;
}

const organizationService = {
  createOrganization,
  getOrganizations,
  getOrganizationById,
  updateOrganization,
  toggleStatus,
  bulkToggleStatus,
};

export default organizationService;
