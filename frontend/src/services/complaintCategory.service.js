import apiClient from "./axios";

const getComplaintCategories = async (params) => {
  const response = await apiClient.get('/complaint-categories', { params });
  return response.data;
};

const createComplaintCategory = async (data) => {
  const response = await apiClient.post('/complaint-categories', data);
  return response.data;
};

const updateComplaintCategory = async (id, data) => {
  const response = await apiClient.put(`/complaint-categories/${id}`, data);
  return response.data;
};

const toggleStatus = async (id) => {
  const response = await apiClient.patch(`/complaint-categories/${id}/status`);
  return response.data;
};

const bulkToggleStatus = async (data) => {
  const response = await apiClient.put('/complaint-categories/bulk-status', data);
  return response.data;
};

export default {
  getComplaintCategories,
  createComplaintCategory,
  updateComplaintCategory,
  toggleStatus,
  bulkToggleStatus,
};
