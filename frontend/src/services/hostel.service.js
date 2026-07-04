import hostelApi from '@/features/dashboard/api/hostelApi';

/**
 * Create a new Hostel
 * @param {Object} payload 
 */
export async function createHostel(payload) {
  const response = await hostelApi.createHostel(payload);
  return response.data;
}

/**
 * Fetch a list of Hostels
 * @param {Object} params - e.g. { page: 1, limit: 10 }
 */
export async function getHostels(params) {
  const response = await hostelApi.getHostels(params);
  return response.data;
}

export async function getSelectionHostels(params) {
  const response = await hostelApi.getSelectionHostels(params);
  return response.data;
}

/**
 * Fetch a single Hostel by ID
 * @param {string} id 
 */
export async function getHostelById(id) {
  const response = await hostelApi.getHostelById(id);
  return response.data;
}

/**
 * Update Hostel details
 * @param {string} id 
 * @param {Object} payload 
 */
export async function updateHostel(id, payload) {
  const response = await hostelApi.updateHostel(id, payload);
  return response.data;
}

/**
 * Toggle Hostel active/inactive status
 * @param {string} id 
 */
export async function toggleStatus(id) {
  const response = await hostelApi.toggleStatus(id);
  return response.data;
}

/**
 * Bulk toggle status of Hostels
 * @param {Object} payload - { ids: [id1, id2], isActive: boolean }
 */
export async function bulkToggleStatus({ids, isActive}) {
  const response = await hostelApi.bulkToggleStatus({ids, isActive});
  return response.data;
}

const hostelService = {
  createHostel,
  getHostels,
  getHostelById,
  updateHostel,
  toggleStatus,
  bulkToggleStatus,
};

export default hostelService;
