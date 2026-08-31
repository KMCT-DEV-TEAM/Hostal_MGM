import apiClient from "./axios";

const getBatches = async (params) => {
  const response = await apiClient.get('/batches', { params });
  return response.data;
};

const createBatch = async (data) => {
  const response = await apiClient.post('/batches', data);
  return response.data;
};

const updateBatch = async (id, data) => {
  const response = await apiClient.put(`/batches/${id}`, data);
  return response.data;
};

const toggleStatus = async (id, data) => {
  const response = await apiClient.patch(`/batches/${id}/status`, data);
  return response.data;
};

const bulkToggleStatus = async (data) => {
  const response = await apiClient.put('/batches/bulk-status', data);
  return response.data;
};

const getBatchById = async (id) => {
  const response = await apiClient.get(`/batches/${id}`);
  return response.data;
};

const getMentorBatches = async (params) => {
  const response = await apiClient.get('/mentor-assignments', { params });
  return response.data;
};

const getMentorAssignmentById = async (id) => {
  const response = await apiClient.get(`/mentor-assignments/${id}`);
  return response.data;
};



export default {
  getBatches,
  getMentorBatches,
  createBatch,
  updateBatch,
  toggleStatus,
  bulkToggleStatus,
  getMentorAssignmentById,
  getBatchById,
};
